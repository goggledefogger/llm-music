import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';

describe('PatternParser - Effects Commands', () => {
  describe('Filter Parsing', () => {
    it('should parse a filter command with all parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nfilter kick: type=lowpass freq=800 Q=1.5';
      const result = PatternParser.parse(pattern);

      expect(result.filterModules?.['kick']).toBeDefined();
      expect(result.filterModules!['kick'].type).toBe('lowpass');
      expect(result.filterModules!['kick'].freq).toBe(800);
      expect(result.filterModules!['kick'].Q).toBe(1.5);
    });

    it('should use defaults for missing filter parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nfilter kick: type=highpass';
      const result = PatternParser.parse(pattern);

      expect(result.filterModules?.['kick']).toBeDefined();
      expect(result.filterModules!['kick'].type).toBe('highpass');
      expect(result.filterModules!['kick'].freq).toBe(20000);
      expect(result.filterModules!['kick'].Q).toBe(1);
    });

    it('should clamp filter frequency to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nfilter kick: type=lowpass freq=50000';
      const result = PatternParser.parse(pattern);

      expect(result.filterModules!['kick'].freq).toBe(20000);
    });

    it('should clamp filter Q to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nfilter kick: type=lowpass Q=100';
      const result = PatternParser.parse(pattern);

      expect(result.filterModules!['kick'].Q).toBe(30);
    });

    it('should default to lowpass for invalid filter type', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nfilter kick: type=invalid freq=800';
      const result = PatternParser.parse(pattern);

      expect(result.filterModules!['kick'].type).toBe('lowpass');
    });

    it('should support all filter types', () => {
      const types = ['lowpass', 'highpass', 'bandpass', 'notch'];
      for (const type of types) {
        const pattern = `TEMPO 120\nseq kick: x...x...\nfilter kick: type=${type}`;
        const result = PatternParser.parse(pattern);
        expect(result.filterModules!['kick'].type).toBe(type);
      }
    });

    it('should validate filter command format', () => {
      const valid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\nfilter kick: type=lowpass freq=800');
      expect(valid.isValid).toBe(true);
    });

    it('should report error for invalid filter format', () => {
      const invalid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\nfilter : type=lowpass');
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.some(e => e.includes('filter'))).toBe(true);
    });
  });

  describe('Delay Parsing', () => {
    it('should parse a delay command with all parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndelay master: time=0.25 feedback=0.4 mix=0.3';
      const result = PatternParser.parse(pattern);

      expect(result.delayModules?.['master']).toBeDefined();
      expect(result.delayModules!['master'].time).toBe(0.25);
      expect(result.delayModules!['master'].feedback).toBe(0.4);
      expect(result.delayModules!['master'].mix).toBe(0.3);
    });

    it('should use defaults for missing delay parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndelay master: time=0.5';
      const result = PatternParser.parse(pattern);

      expect(result.delayModules!['master'].time).toBe(0.5);
      expect(result.delayModules!['master'].feedback).toBe(0.4);
      expect(result.delayModules!['master'].mix).toBe(0.3);
    });

    it('should clamp delay time to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndelay master: time=5.0';
      const result = PatternParser.parse(pattern);

      expect(result.delayModules!['master'].time).toBe(2.0);
    });

    it('should clamp delay feedback to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndelay master: feedback=1.5';
      const result = PatternParser.parse(pattern);

      expect(result.delayModules!['master'].feedback).toBe(0.95);
    });

    it('should clamp delay mix to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndelay master: mix=2.0';
      const result = PatternParser.parse(pattern);

      expect(result.delayModules!['master'].mix).toBe(1);
    });

    it('should validate delay command format', () => {
      const valid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\ndelay master: time=0.25 feedback=0.4 mix=0.3');
      expect(valid.isValid).toBe(true);
    });
  });

  describe('Reverb Parsing', () => {
    it('should parse a reverb command with all parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nreverb master: mix=0.3 decay=2.5 predelay=0.02';
      const result = PatternParser.parse(pattern);

      expect(result.reverbModules?.['master']).toBeDefined();
      expect(result.reverbModules!['master'].mix).toBe(0.3);
      expect(result.reverbModules!['master'].decay).toBe(2.5);
      expect(result.reverbModules!['master'].predelay).toBe(0.02);
    });

    it('should use defaults for missing reverb parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nreverb master: mix=0.5';
      const result = PatternParser.parse(pattern);

      expect(result.reverbModules!['master'].mix).toBe(0.5);
      expect(result.reverbModules!['master'].decay).toBe(2.5);
      expect(result.reverbModules!['master'].predelay).toBe(0.02);
    });

    it('should clamp reverb decay to valid range', () => {
      const low = PatternParser.parse('TEMPO 120\nseq kick: x...x...\nreverb master: decay=0.01');
      const high = PatternParser.parse('TEMPO 120\nseq kick: x...x...\nreverb master: decay=20');

      expect(low.reverbModules!['master'].decay).toBe(0.1);
      expect(high.reverbModules!['master'].decay).toBe(10);
    });

    it('should clamp reverb predelay to valid range', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\nreverb master: predelay=0.5';
      const result = PatternParser.parse(pattern);

      expect(result.reverbModules!['master'].predelay).toBe(0.1);
    });

    it('should validate reverb command format', () => {
      const valid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\nreverb master: mix=0.3');
      expect(valid.isValid).toBe(true);
    });
  });

  describe('Pan Parsing', () => {
    it('should parse a pan command', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\npan kick: value=-0.5';
      const result = PatternParser.parse(pattern);

      expect(result.panModules?.['kick']).toBeDefined();
      expect(result.panModules!['kick'].value).toBe(-0.5);
    });

    it('should clamp pan value to valid range', () => {
      const left = PatternParser.parse('TEMPO 120\nseq kick: x...x...\npan kick: value=-2');
      const right = PatternParser.parse('TEMPO 120\nseq kick: x...x...\npan kick: value=2');

      expect(left.panModules!['kick'].value).toBe(-1);
      expect(right.panModules!['kick'].value).toBe(1);
    });

    it('should return null for pan without value', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\npan kick: invalid';
      const result = PatternParser.parse(pattern);

      expect(result.panModules?.['kick']).toBeUndefined();
    });

    it('should validate pan command format', () => {
      const valid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\npan kick: value=0.5');
      expect(valid.isValid).toBe(true);
    });

    it('should report error for invalid pan value', () => {
      const invalid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\npan kick: notavalue');
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.some(e => e.includes('pan'))).toBe(true);
    });
  });

  describe('Distort Parsing', () => {
    it('should parse a distort command with all parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndistort master: amount=0.5 mix=0.3';
      const result = PatternParser.parse(pattern);

      expect(result.distortModules?.['master']).toBeDefined();
      expect(result.distortModules!['master'].amount).toBe(0.5);
      expect(result.distortModules!['master'].mix).toBe(0.3);
    });

    it('should use defaults for missing distort parameters', () => {
      const pattern = 'TEMPO 120\nseq kick: x...x...\ndistort master: amount=0.8';
      const result = PatternParser.parse(pattern);

      expect(result.distortModules!['master'].amount).toBe(0.8);
      expect(result.distortModules!['master'].mix).toBe(0.3);
    });

    it('should clamp distort amount to valid range', () => {
      const low = PatternParser.parse('TEMPO 120\nseq kick: x...x...\ndistort master: amount=-0.5');
      const high = PatternParser.parse('TEMPO 120\nseq kick: x...x...\ndistort master: amount=2.0');

      expect(low.distortModules!['master'].amount).toBe(0);
      expect(high.distortModules!['master'].amount).toBe(1);
    });

    it('should validate distort command format', () => {
      const valid = PatternParser.validate('TEMPO 120\nseq kick: x...x...\ndistort master: amount=0.5 mix=0.3');
      expect(valid.isValid).toBe(true);
    });
  });

  describe('Combined Effects', () => {
    it('should parse multiple effects together', () => {
      const pattern = `TEMPO 120
seq kick: x...x...x...x...
seq hihat: x.x.x.x.x.x.x.x.
filter kick: type=lowpass freq=800 Q=1.0
pan kick: value=-0.5
pan hihat: value=0.7
delay master: time=0.25 feedback=0.4 mix=0.3
reverb master: mix=0.3 decay=2.5 predelay=0.02
distort master: amount=0.5 mix=0.3`;

      const result = PatternParser.parse(pattern);

      expect(result.filterModules?.['kick']).toBeDefined();
      expect(result.panModules?.['kick']).toBeDefined();
      expect(result.panModules?.['hihat']).toBeDefined();
      expect(result.delayModules?.['master']).toBeDefined();
      expect(result.reverbModules?.['master']).toBeDefined();
      expect(result.distortModules?.['master']).toBeDefined();
      expect(Object.keys(result.instruments)).toHaveLength(2);
    });

    it('should validate combined effects pattern', () => {
      const pattern = `TEMPO 120
seq kick: x...x...x...x...
filter kick: type=highpass freq=200
pan kick: value=-0.3
delay master: time=0.5 feedback=0.3 mix=0.2
reverb master: mix=0.4 decay=3.0
distort master: amount=0.2 mix=0.1`;

      const validation = PatternParser.validate(pattern);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should still work with existing EQ, AMP, COMP, and LFO alongside new effects', () => {
      const pattern = `TEMPO 120
seq kick: x...x...x...x...
eq master: low=2 mid=-1 high=1
amp master: gain=2
comp master: threshold=-20 ratio=4
lfo master.amp: rate=2Hz depth=0.3 wave=sine
filter kick: type=bandpass freq=1000 Q=2
pan kick: value=0.5
delay master: time=0.3 feedback=0.5 mix=0.4
reverb master: mix=0.2 decay=1.5
distort master: amount=0.3 mix=0.2`;

      const result = PatternParser.parse(pattern);

      expect(result.eqModules?.['master']).toBeDefined();
      expect(result.ampModules?.['master']).toBeDefined();
      expect(result.compModules?.['master']).toBeDefined();
      expect(result.lfoModules?.['master.amp']).toBeDefined();
      expect(result.filterModules?.['kick']).toBeDefined();
      expect(result.panModules?.['kick']).toBeDefined();
      expect(result.delayModules?.['master']).toBeDefined();
      expect(result.reverbModules?.['master']).toBeDefined();
      expect(result.distortModules?.['master']).toBeDefined();
    });
  });
});
