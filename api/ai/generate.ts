/**
 * POST /api/ai/generate
 *
 * Main Vercel serverless endpoint for AI pattern generation.
 * Accepts a chat conversation, provider choice, current pattern context,
 * and interaction mode. Streams the LLM response back via SSE.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSystemPrompt } from './system-prompt';
import { streamOpenAI } from './providers/openai';
import { streamAnthropic } from './providers/anthropic';
import { streamGemini } from './providers/gemini';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateRequestBody {
  messages: ChatMessage[];
  provider: 'openai' | 'anthropic' | 'gemini';
  currentPattern?: string;
  mode: 'generate' | 'modify' | 'teach';
}

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'gemini'] as const;
const ALLOWED_MODES = ['generate', 'modify', 'teach'] as const;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse and validate request body
  const body = req.body as GenerateRequestBody | undefined;

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'messages array is required and must not be empty' });
    return;
  }

  const provider = body.provider ?? 'openai';
  if (!ALLOWED_PROVIDERS.includes(provider as any)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}` });
    return;
  }

  const mode = body.mode ?? 'generate';
  if (!ALLOWED_MODES.includes(mode as any)) {
    res.status(400).json({ error: `Invalid mode. Must be one of: ${ALLOWED_MODES.join(', ')}` });
    return;
  }

  // Validate message structure
  for (const msg of body.messages) {
    if (!msg.role || !msg.content || typeof msg.content !== 'string') {
      res.status(400).json({ error: 'Each message must have a role and content string' });
      return;
    }
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      res.status(400).json({ error: 'Message role must be "user" or "assistant"' });
      return;
    }
  }

  // Build the system prompt, optionally injecting the current pattern
  let systemPrompt = getSystemPrompt(mode);
  if (body.currentPattern) {
    systemPrompt += `\n\n## Current Pattern\nThe user is currently working with this pattern:\n\`\`\`pattern\n${body.currentPattern}\n\`\`\`\n`;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    switch (provider) {
      case 'openai':
        await streamOpenAI(body.messages, systemPrompt, res);
        break;
      case 'anthropic':
        await streamAnthropic(body.messages, systemPrompt, res);
        break;
      case 'gemini':
        await streamGemini(body.messages, systemPrompt, res);
        break;
    }

    // Signal completion
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[ai/generate] ${provider} error:`, err);

    // If headers already sent (streaming started), send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
}
