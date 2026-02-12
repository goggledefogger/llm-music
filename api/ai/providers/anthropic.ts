/**
 * Anthropic provider adapter for the AI generate endpoint.
 * Wraps the Anthropic SDK to provide streaming chat completions.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '../prepare-messages';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

export async function streamAnthropic(
  messages: ChatMessage[],
  systemPrompt: string,
  res: { write: (chunk: string) => void },
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }
}
