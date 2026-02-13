/**
 * Google Gemini provider adapter for the AI generate endpoint.
 * Wraps the Google Generative AI SDK to provide streaming chat completions.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage } from '../prepare-messages.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';

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
  let result;
  let retries = 3;
  while (retries > 0) {
    try {
      console.time(`[ai/gemini] sendMessageStream (attempt ${4 - retries})`);
      result = await chat.sendMessageStream(lastMessage.content);
      console.timeEnd(`[ai/gemini] sendMessageStream (attempt ${4 - retries})`);
      break;
    } catch (err) {
      retries--;
      console.error(`[ai/gemini] sendMessageStream failed (attempts left: ${retries}):`, err);
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
    }
  }

  if (!result) throw new Error('Failed to initiate Gemini stream');

  let firstChunk = true;
  try {
    for await (const chunk of result.stream) {
      if (firstChunk) {
        console.log('[ai/gemini] first chunk received');
        firstChunk = false;
      }

      try {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      } catch (textErr) {
        console.warn('[ai/gemini] Could not extract text from chunk:', textErr);
        // Sometimes text() throws if the chunk is a safety block or other non-content
      }
    }
    console.log('[ai/gemini] stream completed');
  } catch (streamErr) {
    console.error('[ai/gemini] Streaming error:', streamErr);
    throw streamErr; // Propagate to generate.ts handler
  }
}
