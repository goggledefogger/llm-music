/**
 * Tests for the AI pattern modification pipeline.
 *
 * These tests verify that when a user has an existing pattern in the editor
 * and asks the AI to modify it (e.g. "mute the hi hat"), the system correctly:
 *
 * 1. Detects the pattern is present and wraps the user message with
 *    explicit modification instructions
 * 2. Includes the exact pattern in the user message so the LLM can see it
 * 3. The system prompt contains prominent modification rules
 * 4. No pattern → no modification wrapping (generation mode)
 */
import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from '../../../../api/_lib/system-prompt';
import { prepareMessages, ChatMessage } from '../../../../api/_lib/prepare-messages';

// --- Fixtures ---

const SAMPLE_PATTERN = `TEMPO 120
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
eq kick: low=2`;

const COMPLEX_PATTERN = `TEMPO 95
seq kick:  x..x..x...x.x...
seq snare: ....x..x....x...
seq hihat: x.xxx.x.x.xxx.x.
seq perc:  ..x...x...x...x.
sample hihat: openhat gain=-1
eq kick: low=2 mid=-1
comp snare: threshold=-18 ratio=6
filter bass: type=lowpass freq=800 q=2
delay snare: time=0.375 feedback=0.4 mix=0.3
reverb clap: decay=2.5 mix=0.4
pan hihat: 0.3`;

// ---- System Prompt Tests ----

describe('getSystemPrompt', () => {
  const prompt = getSystemPrompt();

  it('returns a non-empty string', () => {
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('contains modification rules after the DSL syntax reference', () => {
    const modifyIndex = prompt.indexOf('How to Handle Pattern Modifications');
    const dslIndex = prompt.indexOf('DSL Syntax Reference');
    expect(modifyIndex).toBeGreaterThan(-1);
    expect(dslIndex).toBeGreaterThan(-1);
    // Modification rules appear before the full reference, as a critical section
    expect(modifyIndex).toBeLessThan(dslIndex);
  });

  it('includes explicit verbatim and grid instructions', () => {
    expect(prompt).toContain('exactly 16 characters long');
    expect(prompt).toContain('Ruler for Reference');
    expect(prompt).toContain('|1---2---3---4---|');
  });

  it('includes modification rules description', () => {
    expect(prompt).toContain('How to Handle Pattern Modifications');
    expect(prompt).toContain("Start from the user's EXACT pattern");
  });

  // Reminder test removed as it is now part of Zero Tolerance Rules at the top

  it('contains DSL syntax reference with all commands', () => {
    const commands = ['seq', 'sample', 'lfo', 'filter', 'delay', 'reverb', 'pan', 'distort', 'groove'];
    for (const cmd of commands) {
      expect(prompt).toContain(cmd);
    }
  });

  it('does NOT accept a mode parameter', () => {
    // Ensure getSystemPrompt has zero required arguments
    expect(getSystemPrompt.length).toBe(0);
  });

  it('includes grid rules', () => {
    expect(prompt).toContain('exactly 16 characters long');
    expect(prompt).toContain('Ruler for Reference');
  });

  it('includes failure examples', () => {
    expect(prompt).toContain('FAILURE');
    expect(prompt).toContain('18 chars - NEVER DO THIS');
  });

  it('includes style guide examples', () => {
    expect(prompt).toContain('Style Examples');
    expect(prompt).toContain('Classic House (with Swing)');
    expect(prompt).toContain('groove master: type=swing amount=0.6');
  });
});

// ---- prepareMessages Tests ----

describe('prepareMessages', () => {
  describe('when currentPattern IS provided (modification mode)', () => {
    it('wraps the last user message with modification instructions', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'mute the hi hat' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('I want you to modify my existing pattern below');
      expect(result[0].content).toContain('Do NOT generate a new pattern from scratch');
      expect(result[0].content).toContain('IMPORTANT: You MUST add new lines');
    });

    it('includes the full pattern in the wrapped message', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'mute the hi hat' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      // The entire original pattern must appear in the message
      expect(result[0].content).toContain('seq kick:  x...x...x...x...');
      expect(result[0].content).toContain('seq snare: ....x.......x...');
      expect(result[0].content).toContain('seq hihat: x.x.x.x.x.x.x.x.');
      expect(result[0].content).toContain('eq kick: low=2');
      expect(result[0].content).toContain('TEMPO 120');
    });

    it('includes the original user request in the wrapped message', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'mute the hi hat' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      expect(result[0].content).toContain('mute the hi hat');
    });

    it('preserves the pattern inside a fenced code block', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'add reverb to the snare' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      // Pattern should be inside ```pattern ... ```
      expect(result[0].content).toContain('```pattern\n' + SAMPLE_PATTERN + '\n```');
    });

    it('only modifies the LAST user message', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'create a drum pattern' },
        { role: 'assistant', content: 'Here is a pattern...' },
        { role: 'user', content: 'now mute the hi hat' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      // First user message should be untouched
      expect(result[0].content).toBe('create a drum pattern');
      // Assistant message untouched
      expect(result[1].content).toBe('Here is a pattern...');
      // Last user message should be wrapped
      expect(result[2].content).toContain('modify my existing pattern');
      expect(result[2].content).toContain('now mute the hi hat');
    });

    it('does not mutate the original messages array', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'mute the hi hat' },
      ];
      const original = messages[0].content;
      prepareMessages(messages, SAMPLE_PATTERN);

      expect(messages[0].content).toBe(original);
    });

    it('handles complex patterns with effects', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'remove the delay on snare' },
      ];
      const result = prepareMessages(messages, COMPLEX_PATTERN);

      expect(result[0].content).toContain('delay snare: time=0.375 feedback=0.4 mix=0.3');
      expect(result[0].content).toContain('filter bass: type=lowpass freq=800 q=2');
      expect(result[0].content).toContain('pan hihat: 0.3');
    });
  });

  describe('when currentPattern is NOT provided (generation mode)', () => {
    it('leaves messages completely untouched when pattern is undefined', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'create a funky drum pattern' },
      ];
      const result = prepareMessages(messages, undefined);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('create a funky drum pattern');
    });

    it('leaves messages untouched when pattern is empty string', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'create a drum beat' },
      ];
      const result = prepareMessages(messages, '');

      expect(result[0].content).toBe('create a drum beat');
    });

    it('does NOT include modification instructions', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'make me a beat' },
      ];
      const result = prepareMessages(messages);

      expect(result[0].content).not.toContain('modify my existing pattern');
      expect(result[0].content).not.toContain('Do NOT generate');
    });
  });

  describe('edge cases', () => {
    it('handles single assistant message (no user message to wrap)', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: 'Hello!' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      // Should not crash; assistant message unchanged
      expect(result[0].content).toBe('Hello!');
    });

    it('handles empty messages array', () => {
      const result = prepareMessages([], SAMPLE_PATTERN);
      expect(result).toEqual([]);
    });

    it('preserves message roles', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
        { role: 'user', content: 'change something' },
      ];
      const result = prepareMessages(messages, SAMPLE_PATTERN);

      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(result[2].role).toBe('user');
    });
  });
});

// ---- Full Pipeline Simulation ----

describe('AI modification pipeline (end-to-end data flow)', () => {
  it('simulates "mute the hi hat" — verifies the full message sent to LLM', () => {
    // This simulates exactly what happens when:
    // 1. User has a pattern in the editor
    // 2. User types "mute the hi hat" in chat
    // 3. Frontend sends { messages, currentPattern } to backend
    // 4. Backend prepares messages for the LLM provider

    const editorContent = SAMPLE_PATTERN;
    const userPrompt = 'mute the hi hat';

    // Step 1: Frontend builds the payload (from aiService.ts sseStream)
    const history: ChatMessage[] = [];
    const frontendMessages: ChatMessage[] = [
      ...history,
      { role: 'user', content: userPrompt },
    ];
    const currentPattern = editorContent || undefined;

    // Step 2: Backend prepares messages (from generate.ts)
    const systemPrompt = getSystemPrompt();
    const finalMessages = prepareMessages(frontendMessages, currentPattern);

    // Step 3: Verify the system prompt has modification rules
    expect(systemPrompt).toContain('exactly 16 characters long');
    expect(systemPrompt).toContain('How to Handle Pattern Modifications');

    // Step 4: Verify the user message sent to the LLM
    const lastMessage = finalMessages[finalMessages.length - 1];
    expect(lastMessage.role).toBe('user');

    // Must contain the full original pattern
    expect(lastMessage.content).toContain('TEMPO 120');
    expect(lastMessage.content).toContain('seq kick:  x...x...x...x...');
    expect(lastMessage.content).toContain('seq snare: ....x.......x...');
    expect(lastMessage.content).toContain('seq hihat: x.x.x.x.x.x.x.x.');
    expect(lastMessage.content).toContain('eq kick: low=2');

    // Must contain the user's actual request
    expect(lastMessage.content).toContain('mute the hi hat');

    // Pattern must be in a fenced code block
    expect(lastMessage.content).toContain('```pattern\n');
  });

  it('simulates generation with no pattern — message passes through unchanged', () => {
    const editorContent = '';
    const userPrompt = 'create a funky drum pattern at 100 BPM';

    const frontendMessages: ChatMessage[] = [
      { role: 'user', content: userPrompt },
    ];
    const currentPattern = editorContent || undefined;

    const finalMessages = prepareMessages(frontendMessages, currentPattern);

    // Message should be completely unchanged
    expect(finalMessages[0].content).toBe(userPrompt);
    expect(finalMessages[0].content).not.toContain('modify');
    expect(finalMessages[0].content).not.toContain('```pattern');
  });

  it('simulates multi-turn conversation with pattern modification', () => {
    // User had a conversation, then asks for a modification
    const history: ChatMessage[] = [
      { role: 'user', content: 'create a basic drum beat' },
      { role: 'assistant', content: 'Here is a basic beat:\n```pattern\nTEMPO 120\nseq kick: x...x...\n```' },
    ];
    const editorContent = SAMPLE_PATTERN;
    const userPrompt = 'make the kick pattern more syncopated';

    const frontendMessages: ChatMessage[] = [
      ...history,
      { role: 'user', content: userPrompt },
    ];

    const finalMessages = prepareMessages(frontendMessages, editorContent);

    // History should be preserved untouched
    expect(finalMessages[0].content).toBe('create a basic drum beat');
    expect(finalMessages[1].content).toContain('Here is a basic beat');

    // Only the last message should be wrapped
    const lastMsg = finalMessages[2];
    expect(lastMsg.content).toContain('modify my existing pattern');
    expect(lastMsg.content).toContain(SAMPLE_PATTERN);
    expect(lastMsg.content).toContain('make the kick pattern more syncopated');
  });
});
