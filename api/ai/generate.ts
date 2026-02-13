/**
 * POST /api/ai/generate
 *
 * Main Vercel serverless endpoint for AI pattern generation.
 * Accepts a chat conversation, provider choice, and current pattern context.
 * Streams the LLM response back via SSE.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import { getSystemPrompt } from '../_lib/system-prompt.js';
import { prepareMessages } from '../_lib/prepare-messages.js';
import type { ChatMessage } from '../_lib/prepare-messages.js';
import { streamOpenAI } from '../_lib/providers/openai.js';
import { streamAnthropic } from '../_lib/providers/anthropic.js';
import { streamGemini } from '../_lib/providers/gemini.js';

console.log('[API] generate.ts module loading...');

export type { ChatMessage };

interface GenerateRequestBody {
  messages: ChatMessage[];
  provider: 'openai' | 'anthropic' | 'gemini';
  currentPattern?: string;
}

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'gemini'] as const;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('--- API OPTIONS REQUEST ---');
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    console.log('--- API NON-POST REQUEST ---', req.method);
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('--- API POST REQUEST START ---');

  // Verify authentication
  console.time('[ai/generate] verifyAuth');
  const authUser = await verifyAuth(req);
  console.timeEnd('[ai/generate] verifyAuth');
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized — valid auth token required' });
    return;
  }

  // Parse and validate request body
  const body = req.body as GenerateRequestBody | undefined;

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'messages array is required and must not be empty' });
    return;
  }

  const provider = body.provider ?? 'gemini';
  if (!ALLOWED_PROVIDERS.includes(provider as any)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}` });
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

  // Build the system prompt (unified, no mode parameter)
  console.time('[ai/generate] getSystemPrompt');
  const systemPrompt = getSystemPrompt();
  console.timeEnd('[ai/generate] getSystemPrompt');

  // Prepare messages (injects pattern into last user message if present)
  console.time('[ai/generate] prepareMessages');
  const messages = prepareMessages(body.messages, body.currentPattern);
  console.timeEnd('[ai/generate] prepareMessages');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    switch (provider) {
      case 'openai':
        await streamOpenAI(messages, systemPrompt, res);
        break;
      case 'anthropic':
        await streamAnthropic(messages, systemPrompt, res);
        break;
      case 'gemini':
        await streamGemini(messages, systemPrompt, res);
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
