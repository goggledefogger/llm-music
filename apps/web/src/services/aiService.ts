// AI Service - handles streaming communication with the AI backend
// Falls back to mock responses when the API is unavailable

export type AIProvider = 'openai' | 'anthropic' | 'gemini';
export type ChatMode = 'generate' | 'modify' | 'teach';

export interface AIRequestPayload {
  prompt: string;
  context: string; // current editor content
  provider: AIProvider;
  mode: ChatMode;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// --- Mock fallback for development ---

const MOCK_PATTERNS: Record<string, string> = {
  beat: `Here's a basic drum beat for you:

\`\`\`
TEMPO 120
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
\`\`\`

This creates a standard 4/4 rock beat at 120 BPM. The kick hits on beats 1 and 3, the snare on 2 and 4, and the hi-hat plays eighth notes throughout.`,

  funk: `Here's a funky pattern:

\`\`\`
TEMPO 100
seq kick:  x..x..x...x.x...
seq snare: ....x..x....x...
seq hihat: x.xxx.x.x.xxx.x.
seq perc:  ..x...x...x...x.
\`\`\`

This groove has a syncopated kick pattern and ghost notes on the hi-hat for that funky feel.`,

  default: `Here's a pattern based on your request:

\`\`\`
TEMPO 110
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
seq clap:  ....x.......x...
\`\`\`

I've created a basic four-on-the-floor pattern. You can modify the tempo or add more instruments as needed!`,
};

function selectMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('funk') || lower.includes('groove') || lower.includes('syncopat')) {
    return MOCK_PATTERNS.funk;
  }
  if (lower.includes('beat') || lower.includes('drum') || lower.includes('basic') || lower.includes('simple')) {
    return MOCK_PATTERNS.beat;
  }
  return MOCK_PATTERNS.default;
}

async function* mockStream(prompt: string): AsyncGenerator<string> {
  const response = selectMockResponse(prompt);
  // Stream character by character with a small delay for realistic feel
  for (const char of response) {
    await new Promise(r => setTimeout(r, 15));
    yield char;
  }
}

// --- SSE streaming from the real backend ---

async function* sseStream(payload: AIRequestPayload): AsyncGenerator<string> {
  // Transform frontend payload into backend-expected format
  const messages = [
    ...payload.history,
    { role: 'user' as const, content: payload.prompt },
  ];
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      provider: payload.provider,
      mode: payload.mode,
      currentPattern: payload.context || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from the buffer
    const lines = buffer.split('\n');
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          // If not JSON, treat as raw text
          if (data && !(e instanceof SyntaxError)) throw e;
          if (data && e instanceof SyntaxError) {
            yield data;
          }
        }
      }
    }
  }
}

// --- Public API ---

export async function* streamAIResponse(
  payload: AIRequestPayload
): AsyncGenerator<string> {
  try {
    yield* sseStream(payload);
  } catch (error) {
    // Fall back to mock on any API failure (404, network error, etc.)
    console.warn('AI API unavailable, using mock fallback:', error);
    yield* mockStream(payload.prompt);
  }
}

// --- Pattern extraction ---

export function extractPatterns(content: string): string[] {
  const patterns: string[] = [];
  const regex = /```(?:ascii|pattern)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const pattern = match[1].trim();
    if (pattern) {
      patterns.push(pattern);
    }
  }
  return patterns;
}

// --- Provider storage ---

const PROVIDER_STORAGE_KEY = 'ai-provider';
const MODE_STORAGE_KEY = 'ai-chat-mode';

export function getStoredProvider(): AIProvider {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored === 'openai' || stored === 'anthropic' || stored === 'gemini') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'openai';
}

export function setStoredProvider(provider: AIProvider): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    // localStorage unavailable
  }
}

export function getStoredMode(): ChatMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'generate' || stored === 'modify' || stored === 'teach') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'generate';
}

export function setStoredMode(mode: ChatMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable
  }
}
