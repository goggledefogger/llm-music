/**
 * Google Gemini provider adapter for the AI generate endpoint.
 * Wraps the Google Generative AI SDK to provide streaming chat completions.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '../generate';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export async function streamGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  res: { write: (chunk: string) => void },
): Promise<void> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: systemPrompt,
  });

  // Convert chat messages to Gemini's history format.
  // Gemini uses "user" and "model" roles. History must not include the last user message.
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('Last message must be from the user');
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
  }
}
