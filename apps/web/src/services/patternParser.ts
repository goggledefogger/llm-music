// Basic pattern parser for ASCII Generative Sequencer
import { ParsedPattern } from '../types/audio';

export class PatternParser {
  private static readonly DEFAULT_TEMPO = 120;
  private static readonly MAX_STEPS = 32;

  /**
   * Parse a simple ASCII pattern into a structured format
   * Phase 1: Very basic parsing - just tempo and simple sequences
   */
  static parse(pattern: string): ParsedPattern {
    const lines = pattern.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let tempo = this.DEFAULT_TEMPO;
    const instruments: ParsedPattern['instruments'] = {};

    for (const line of lines) {
      // Parse tempo
      if (line.startsWith('TEMPO ')) {
        const tempoMatch = line.match(/TEMPO\s+(\d+)/);
        if (tempoMatch) {
          tempo = Math.max(60, Math.min(200, parseInt(tempoMatch[1], 10)));
        }
        continue;
      }

      // Parse instrument sequences
      if (line.startsWith('seq ')) {
        const seqMatch = line.match(/seq\s+(\w+):\s*(.+)/);
        if (seqMatch) {
          const [, instrumentName, patternString] = seqMatch;
          const steps = this.parsePatternString(patternString);

          if (steps.length > 0) {
            instruments[instrumentName] = {
              steps,
              name: instrumentName
            };
          }
        }
      }
    }

    // Calculate total steps (use the longest pattern or default to 16)
    const totalSteps = Math.max(
      16,
      ...Object.values(instruments).map(inst => inst.steps.length)
    );

    return {
      tempo,
      instruments,
      totalSteps
    };
  }

  /**
   * Parse a pattern string like "x...x..." into boolean array
   */
  private static parsePatternString(pattern: string): boolean[] {
    const steps: boolean[] = [];

    for (const char of pattern) {
      if (char === 'x' || char === 'X') {
        steps.push(true);
      } else if (char === '.') {
        steps.push(false);
      }
      // Ignore spaces and other characters
    }

    // Limit to max steps
    return steps.slice(0, this.MAX_STEPS);
  }

  /**
   * Validate a pattern string
   */
  static validate(pattern: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pattern.trim()) {
      errors.push('Pattern cannot be empty');
      return { isValid: false, errors };
    }

    const lines = pattern.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let hasValidSequence = false;

    for (const line of lines) {
      // Check tempo format
      if (line.startsWith('TEMPO ')) {
        const tempoMatch = line.match(/TEMPO\s+(\d+)/);
        if (!tempoMatch) {
          errors.push('Invalid tempo format. Use: TEMPO 120');
        } else {
          const tempo = parseInt(tempoMatch[1], 10);
          if (tempo < 60 || tempo > 200) {
            errors.push('Tempo must be between 60 and 200 BPM');
          }
        }
        continue;
      }

      // Check sequence format
      if (line.startsWith('seq ')) {
        const seqMatch = line.match(/seq\s+(\w+):\s*(.+)/);
        if (!seqMatch) {
          errors.push(`Invalid sequence format: ${line}`);
        } else {
          const [, instrumentName, patternString] = seqMatch;
          if (!/^[xX.\s]+$/.test(patternString)) {
            errors.push(`Invalid pattern characters in ${instrumentName}. Use only 'x' and '.'`);
          } else {
            hasValidSequence = true;
          }
        }
      }
    }

    if (!hasValidSequence) {
      errors.push('At least one valid sequence is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
