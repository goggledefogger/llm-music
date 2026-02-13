import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';

describe('PatternParser', () => {
  describe('Basic Pattern Parsing', () => {
    it('should parse a simple kick drum pattern', () => {
      const pattern = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120);
      expect(result.instruments.kick).toBeDefined();
      expect(result.instruments.kick.name).toBe('kick');
      expect(result.instruments.kick.steps).toEqual([
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false   // x...
      ]);
      expect(result.totalSteps).toBe(16);
    });

    it('should parse multiple instruments', () => {
      const pattern = `TEMPO 120

seq kick: x...x...x...x...
seq snare: ..x...x...x...x.
seq hihat: x.x.x.x.x.x.x.x.`;

      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120);
      expect(result.instruments.kick).toBeDefined();
      expect(result.instruments.snare).toBeDefined();
      expect(result.instruments.hihat).toBeDefined();

      // Check kick pattern
      expect(result.instruments.kick.steps).toEqual([
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false   // x...
      ]);

      // Check snare pattern
      expect(result.instruments.snare.steps).toEqual([
        false, false, true, false,  // ..x.
        false, false, true, false,  // ..x.
        false, false, true, false,  // ..x.
        false, false, true, false   // ..x.
      ]);

      // Check hihat pattern
      expect(result.instruments.hihat.steps).toEqual([
        true, false, true, false,   // x.x.
        true, false, true, false,   // x.x.
        true, false, true, false,   // x.x.
        true, false, true, false    // x.x.
      ]);
    });

    it('should use default tempo when not specified', () => {
      const pattern = 'seq kick: x...x...x...x...';
      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120); // Default tempo
    });

    it('should handle different tempos', () => {
      const pattern = 'TEMPO 140\n\nseq kick: x...x...x...x...';
      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(140);
    });

    it('should clamp tempo to valid range', () => {
      const lowTempo = 'TEMPO 50\n\nseq kick: x...x...x...x...';
      const highTempo = 'TEMPO 250\n\nseq kick: x...x...x...x...';

      const lowResult = PatternParser.parse(lowTempo);
      const highResult = PatternParser.parse(highTempo);

      expect(lowResult.tempo).toBe(60); // Clamped to minimum
      expect(highResult.tempo).toBe(200); // Clamped to maximum
    });
  });

  describe('Pattern String Parsing', () => {
    it('should parse x and . characters correctly', () => {
      const pattern = 'seq kick: x.x.x.x.';
      const result = PatternParser.parse(pattern);

      expect(result.instruments.kick.steps).toEqual([
        true, false, true, false, true, false, true, false
      ]);
    });

    it('should handle uppercase and lowercase x', () => {
      const pattern = 'seq kick: X.x.X.x.';
      const result = PatternParser.parse(pattern);

      expect(result.instruments.kick.steps).toEqual([
        true, false, true, false, true, false, true, false
      ]);
    });

    it('should ignore spaces in pattern strings', () => {
      const pattern = 'seq kick: x . x . x . x .';
      const result = PatternParser.parse(pattern);

      expect(result.instruments.kick.steps).toEqual([
        true, false, true, false, true, false, true, false
      ]);
    });

    it('should limit pattern length to MAX_STEPS', () => {
      const longPattern = 'seq kick: ' + 'x'.repeat(50);
      const result = PatternParser.parse(longPattern);

      expect(result.instruments.kick.steps.length).toBe(32); // MAX_STEPS
    });

    it('should handle empty pattern strings', () => {
      const pattern = 'seq kick: ';
      const result = PatternParser.parse(pattern);

      // Empty pattern strings should not create an instrument entry
      expect(result.instruments.kick).toBeUndefined();
    });
  });

  describe('Total Steps Calculation', () => {
    it('should use the longest pattern length', () => {
      const pattern = `TEMPO 120

seq kick: x...x...x...x...x...x...x...x...
seq snare: x...x...`;

      const result = PatternParser.parse(pattern);

      expect(result.totalSteps).toBe(32); // Longest pattern
    });

    it('should default to 16 steps when no patterns exist', () => {
      const pattern = 'TEMPO 120';
      const result = PatternParser.parse(pattern);

      expect(result.totalSteps).toBe(16);
    });

    it('should handle single step patterns', () => {
      const pattern = 'seq kick: x';
      const result = PatternParser.parse(pattern);

      // Should default to 16 steps minimum, not 1
      expect(result.totalSteps).toBe(16);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate a correct pattern', () => {
      const pattern = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validInstruments).toContain('kick');
    });

    it('should detect empty pattern', () => {
      const validation = PatternParser.validate('');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Pattern cannot be empty');
    });

    it('should detect missing tempo', () => {
      const pattern = 'seq kick: x...x...x...x...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(true); // Valid but with warning
      expect(validation.warnings).toContain('No tempo specified. Using default tempo of 120 BPM.');
    });

    it('should detect invalid tempo format', () => {
      const pattern = 'TEMPO abc\n\nseq kick: x...x...x...x...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid tempo format. Use: TEMPO 120');
    });

    it('should detect tempo out of range', () => {
      const pattern = 'TEMPO 50\n\nseq kick: x...x...x...x...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Tempo must be between 60 and 200 BPM');
    });

    it('should detect invalid sequence format', () => {
      const pattern = 'TEMPO 120\n\ninvalid kick: x...x...x...x...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(false);
      // The validation should detect that this is not a valid sequence format
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid pattern characters', () => {
      const pattern = 'TEMPO 120\n\nseq kick: xyz...';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Invalid pattern characters in kick. Use only 'x', 'X', 'o', and '.'");
      expect(validation.invalidInstruments).toContain('kick');
    });

    it('should detect missing sequences', () => {
      const pattern = 'TEMPO 120';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least one valid sequence is required');
    });

    it('should warn about very short patterns', () => {
      const pattern = 'TEMPO 120\n\nseq kick: x..';
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(warning => warning.includes('very few steps'))).toBe(true);
    });

    it('should warn about very long patterns', () => {
      const pattern = 'TEMPO 120\n\nseq kick: ' + 'x'.repeat(40);
      const validation = PatternParser.validate(pattern);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(warning => warning.includes('many steps'))).toBe(true);
    });
  });

  describe('Partial Parsing', () => {
    it('should parse valid parts of an invalid pattern', () => {
      const pattern = `TEMPO 120

seq kick: x...x...x...x...
seq snare: xyz...
seq hihat: x.x.x.x.x.x.x.x.`;

      const result = PatternParser.parsePartial(pattern);

      expect(result.parsed).toBeNull(); // Overall parsing failed
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validInstruments).toContain('kick');
      expect(result.validInstruments).toContain('hihat');
    });

    it('should return parsed result for valid pattern', () => {
      const pattern = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      const result = PatternParser.parsePartial(pattern);

      expect(result.parsed).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.validInstruments).toContain('kick');
    });

    it('should handle parsing errors gracefully', () => {
      const pattern = 'INVALID PATTERN FORMAT';
      const result = PatternParser.parsePartial(pattern);

      expect(result.parsed).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle patterns with extra whitespace', () => {
      const pattern = '  TEMPO 120  \n\n  seq kick: x...x...x...x...  ';
      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120);
      expect(result.instruments.kick).toBeDefined();
    });

    it('should handle patterns with empty lines', () => {
      const pattern = 'TEMPO 120\n\n\nseq kick: x...x...x...x...\n\n';
      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120);
      expect(result.instruments.kick).toBeDefined();
    });

    it('should handle instrument names with different cases', () => {
      const pattern = 'TEMPO 120\n\nseq KICK: x...x...x...x...';
      const result = PatternParser.parse(pattern);

      expect(result.instruments.KICK).toBeDefined();
    });

    it('should handle patterns with comments or extra text', () => {
      const pattern = `TEMPO 120
# This is a comment
seq kick: x...x...x...x...
# Another comment`;

      const result = PatternParser.parse(pattern);

      expect(result.tempo).toBe(120);
      expect(result.instruments.kick).toBeDefined();
    });
  });
});
