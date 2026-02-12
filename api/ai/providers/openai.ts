/**
 * OpenAI provider adapter for the AI generate endpoint.
 * Wraps the OpenAI SDK to provide streaming chat completions.
 */
import OpenAI from 'openai';
import type { ChatMessage } from '../generate';

const DEFAULT_MODEL = 'gpt-4o-mini';

export async function streamOpenAI(
  messages: ChatMessage[],
  systemPrompt: string,
  res: { write: (chunk: string) => void },
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
}
