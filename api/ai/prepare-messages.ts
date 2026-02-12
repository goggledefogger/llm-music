/**
 * Pure utility for preparing the messages array before sending to an LLM provider.
 * Separated from generate.ts so it can be tested without importing provider SDKs.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Prepare the messages array for the LLM provider.
 * When a currentPattern is provided, the last user message is wrapped with
 * explicit modification instructions so the LLM edits the pattern in place
 * instead of generating from scratch.
 */
export function prepareMessages(
  messages: ChatMessage[],
  currentPattern?: string,
): ChatMessage[] {
  const prepared = [...messages];
  if (currentPattern) {
    const last = prepared[prepared.length - 1];
    if (last && last.role === 'user') {
      prepared[prepared.length - 1] = {
        ...last,
        content: `I want you to modify my existing pattern below. Do NOT generate a new pattern from scratch — start from my exact pattern and only change what I ask for. Every line I don't mention must stay exactly the same.\n\nMy current pattern:\n\`\`\`pattern\n${currentPattern}\n\`\`\`\n\nWhat I want changed: ${last.content}`,
      };
    }
  }
  return prepared;
}
