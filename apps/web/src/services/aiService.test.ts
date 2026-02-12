import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractPatterns, streamAIResponse } from './aiService';

describe('extractPatterns', () => {
  it('extracts a pattern from a fenced code block with pattern tag', () => {
    const content = `Here is your pattern:\n\`\`\`pattern\nTEMPO 120\nseq kick: x...x...\n\`\`\``;
    const result = extractPatterns(content);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('TEMPO 120\nseq kick: x...x...');
  });

  it('extracts a pattern from a fenced code block with ascii tag', () => {
    const content = `\`\`\`ascii\nTEMPO 90\nseq snare: ....x...\n\`\`\``;
    const result = extractPatterns(content);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('TEMPO 90\nseq snare: ....x...');
  });

  it('extracts a pattern from a plain fenced code block', () => {
    const content = `\`\`\`\nTEMPO 120\nseq kick: x...\n\`\`\``;
    const result = extractPatterns(content);
    expect(result).toHaveLength(1);
  });

  it('extracts multiple patterns', () => {
    const content = `Before:\n\`\`\`pattern\nTEMPO 120\nseq kick: x...\n\`\`\`\nAfter:\n\`\`\`pattern\nTEMPO 120\nseq kick: ....\n\`\`\``;
    const result = extractPatterns(content);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no patterns found', () => {
    const content = 'Just some text without any code blocks';
    expect(extractPatterns(content)).toEqual([]);
  });

  it('skips empty code blocks', () => {
    const content = `\`\`\`pattern\n\n\`\`\``;
    expect(extractPatterns(content)).toEqual([]);
  });
});

describe('streamAIResponse mock fallback', () => {
  // These tests verify that when the API is unavailable,
  // the mock fallback handles modification requests correctly.

  // Mock fetch to always fail so we hit the mock path
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('API unavailable'))));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function collectStream(gen: AsyncGenerator<string>): Promise<string> {
    let result = '';
    for await (const chunk of gen) {
      result += chunk;
    }
    return result;
  }

  it('mock generates a pattern when no context is provided', async () => {
    const result = await collectStream(
      streamAIResponse({
        prompt: 'create a drum beat',
        context: '',
        provider: 'openai',
        history: [],
      })
    );

    const patterns = extractPatterns(result);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toContain('seq kick');
  });

  it('mock mutes hihat when asked "mute the hi hat" with a pattern', async () => {
    const currentPattern = `TEMPO 120
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

    const result = await collectStream(
      streamAIResponse({
        prompt: 'mute the hi hat',
        context: currentPattern,
        provider: 'openai',
        history: [],
      })
    );

    const patterns = extractPatterns(result);
    expect(patterns).toHaveLength(1);
    const modified = patterns[0];

    // Kick and snare should be unchanged
    expect(modified).toContain('seq kick:  x...x...x...x...');
    expect(modified).toContain('seq snare: ....x.......x...');

    // Hihat should be all rests
    expect(modified).toContain('seq hihat:');
    expect(modified).not.toContain('seq hihat: x.x.x.x.x.x.x.x.');
    // The hihat line should only have dots (rests)
    const hihatLine = modified.split('\n').find(l => l.includes('seq hihat'));
    expect(hihatLine).toBeTruthy();
    const hihatSteps = hihatLine!.split(':')[1].trim();
    expect(hihatSteps).toMatch(/^\.+$/);
  });

  it('mock mutes snare when asked "mute the snare"', async () => {
    const currentPattern = `TEMPO 120
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

    const result = await collectStream(
      streamAIResponse({
        prompt: 'mute the snare',
        context: currentPattern,
        provider: 'openai',
        history: [],
      })
    );

    const patterns = extractPatterns(result);
    expect(patterns).toHaveLength(1);
    const modified = patterns[0];

    // Kick and hihat should be unchanged
    expect(modified).toContain('seq kick:  x...x...x...x...');
    expect(modified).toContain('seq hihat: x.x.x.x.x.x.x.x.');

    // Snare should be all rests
    const snareLine = modified.split('\n').find(l => l.includes('seq snare'));
    expect(snareLine).toBeTruthy();
    const snareSteps = snareLine!.split(':')[1].trim();
    expect(snareSteps).toMatch(/^\.+$/);
  });

  it('mock preserves tempo and effects when modifying', async () => {
    const currentPattern = `TEMPO 95
seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
eq kick: low=2`;

    const result = await collectStream(
      streamAIResponse({
        prompt: 'mute the hihat',
        context: currentPattern,
        provider: 'openai',
        history: [],
      })
    );

    const patterns = extractPatterns(result);
    const modified = patterns[0];
    expect(modified).toContain('TEMPO 95');
    expect(modified).toContain('eq kick: low=2');
  });

  it('mock shows API-unavailable message for unsupported modifications', async () => {
    const currentPattern = `TEMPO 120
seq kick:  x...x...x...x...`;

    const result = await collectStream(
      streamAIResponse({
        prompt: 'add reverb to the kick',
        context: currentPattern,
        provider: 'openai',
        history: [],
      })
    );

    expect(result).toContain('API unavailable');
    // Should still return the original pattern unchanged
    const patterns = extractPatterns(result);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toContain('seq kick:  x...x...x...x...');
  });
});
