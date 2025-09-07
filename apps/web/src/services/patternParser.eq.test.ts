import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';
// import { EQModule } from '../types/app'; // Not used in this test file

describe('PatternParser - EQ Module Support', () => {
  it('should parse EQ modules with valid syntax', () => {
    const pattern = `TEMPO 120

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=-1 high=1
eq snare: low=-2 mid=3 high=-1

seq kick: x...x...x...x...
seq snare: ....x.......x...`;

    const result = PatternParser.parse(pattern);

    expect(result.eqModules).toBeDefined();
    expect(result.eqModules!.master).toEqual({
      name: 'master',
      low: 0,
      mid: 0,
      high: 0
    });
    expect(result.eqModules!.kick).toEqual({
      name: 'kick',
      low: 2,
      mid: -1,
      high: 1
    });
    expect(result.eqModules!.snare).toEqual({
      name: 'snare',
      low: -2,
      mid: 3,
      high: -1
    });
  });

  it('should clamp EQ values to -3 to +3 range', () => {
    const pattern = `TEMPO 120

eq test: low=5 mid=-10 high=0`;

    const result = PatternParser.parse(pattern);

    expect(result.eqModules!.test).toEqual({
      name: 'test',
      low: 3,    // Clamped from 5
      mid: -3,   // Clamped from -10
      high: 0
    });
  });

  it('should handle invalid EQ syntax gracefully', () => {
    const pattern = `TEMPO 120

eq invalid: low=2 mid=invalid high=1
eq valid: low=1 mid=2 high=3

seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);

    // Invalid EQ should be ignored
    expect(result.eqModules!.invalid).toBeUndefined();

    // Valid EQ should be parsed
    expect(result.eqModules!.valid).toEqual({
      name: 'valid',
      low: 1,
      mid: 2,
      high: 3
    });
  });

  it('should validate EQ syntax correctly', () => {
    const validPattern = `TEMPO 120
eq master: low=0 mid=0 high=0
seq kick: x...x...x...x...`;

    const invalidPattern = `TEMPO 120
eq invalid: low=2 mid=invalid high=1
seq kick: x...x...x...x...`;

    const validResult = PatternParser.validate(validPattern);
    const invalidResult = PatternParser.validate(invalidPattern);

    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.some(error =>
      error.includes('Invalid EQ values') && error.includes('invalid')
    )).toBe(true);
  });

  it('should handle patterns without EQ modules', () => {
    const pattern = `TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...`;

    const result = PatternParser.parse(pattern);

    expect(result.eqModules).toBeDefined();
    expect(Object.keys(result.eqModules || {})).toHaveLength(0);
  });

  it('should support multiple EQ modules for different instruments', () => {
    const pattern = `TEMPO 120

eq master: low=0 mid=0 high=0
eq kick: low=3 mid=-2 high=1
eq snare: low=-1 mid=2 high=1
eq hihat: low=0 mid=0 high=2

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

    const result = PatternParser.parse(pattern);

    expect(Object.keys(result.eqModules || {})).toHaveLength(4);
    expect(result.eqModules!.master).toBeDefined();
    expect(result.eqModules!.kick).toBeDefined();
    expect(result.eqModules!.snare).toBeDefined();
    expect(result.eqModules!.hihat).toBeDefined();
  });
});
