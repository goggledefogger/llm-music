import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';

describe('PatternParser - AMP Module', () => {
  it('should parse amp module with positive gain', () => {
    const pattern = `TEMPO 120
amp kick: gain=2
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.ampModules!.kick).toEqual({ name: 'kick', gain: 2 });
  });

  it('should parse amp module with negative gain', () => {
    const pattern = `TEMPO 120
amp snare: gain=-2
seq snare: ....x.......x...`;

    const result = PatternParser.parse(pattern);
    expect(result.ampModules!.snare).toEqual({ name: 'snare', gain: -2 });
  });

  it('should clamp amp gain to -3..+3 range', () => {
    const pattern = `TEMPO 120
amp loud: gain=10
amp quiet: gain=-10
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.ampModules!.loud.gain).toBe(3);
    expect(result.ampModules!.quiet.gain).toBe(-3);
  });

  it('should return null for amp without gain parameter', () => {
    const pattern = `TEMPO 120
amp broken: volume=5
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.ampModules!.broken).toBeUndefined();
  });

  it('should validate amp format in validation', () => {
    const valid = `TEMPO 120\namp kick: gain=1\nseq kick: x...x...x...x...`;
    const invalid = `TEMPO 120\namp : gain=1\nseq kick: x...x...x...x...`;

    expect(PatternParser.validate(valid).isValid).toBe(true);
    expect(PatternParser.validate(invalid).errors.length).toBeGreaterThan(0);
  });
});

describe('PatternParser - COMP Module', () => {
  it('should parse comp module with all parameters', () => {
    const pattern = `TEMPO 120
comp master: threshold=-20 ratio=4 attack=0.01 release=0.25 knee=30
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.compModules!.master).toEqual({
      name: 'master',
      threshold: -20,
      ratio: 4,
      attack: 0.01,
      release: 0.25,
      knee: 30,
    });
  });

  it('should apply defaults for missing comp parameters', () => {
    const pattern = `TEMPO 120
comp master: threshold=-12
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const comp = result.compModules!.master;
    expect(comp.threshold).toBe(-12);
    expect(comp.ratio).toBe(4);       // default
    expect(comp.attack).toBe(0.01);   // default
    expect(comp.release).toBe(0.25);  // default
    expect(comp.knee).toBe(30);       // default
  });

  it('should clamp comp values to valid ranges', () => {
    const pattern = `TEMPO 120
comp test: threshold=10 ratio=100 attack=5 release=10 knee=100
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const comp = result.compModules!.test;
    expect(comp.threshold).toBe(0);     // max 0
    expect(comp.ratio).toBe(20);        // max 20
    expect(comp.attack).toBe(0.3);      // max 0.3
    expect(comp.release).toBe(1);       // max 1
    expect(comp.knee).toBe(40);         // max 40
  });

  it('should clamp comp values at lower bounds', () => {
    const pattern = `TEMPO 120
comp test: threshold=-100 ratio=0 attack=0 release=0 knee=-5
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const comp = result.compModules!.test;
    expect(comp.threshold).toBe(-60);   // min -60
    expect(comp.ratio).toBe(1);         // min 1
    expect(comp.attack).toBe(0.001);    // min 0.001
    expect(comp.release).toBe(0.02);    // min 0.02
    expect(comp.knee).toBe(0);          // min 0
  });

  it('should parse comp parameters in any order', () => {
    const pattern = `TEMPO 120
comp master: knee=10 attack=0.05 threshold=-30 release=0.5 ratio=8
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const comp = result.compModules!.master;
    expect(comp.threshold).toBe(-30);
    expect(comp.ratio).toBe(8);
    expect(comp.attack).toBe(0.05);
    expect(comp.release).toBe(0.5);
    expect(comp.knee).toBe(10);
  });

  it('should validate comp format', () => {
    const valid = `TEMPO 120\ncomp master: threshold=-24\nseq kick: x...x...x...x...`;
    const invalid = `TEMPO 120\ncomp : threshold=-24\nseq kick: x...x...x...x...`;

    expect(PatternParser.validate(valid).isValid).toBe(true);
    expect(PatternParser.validate(invalid).errors.length).toBeGreaterThan(0);
  });
});

describe('PatternParser - LFO Module', () => {
  it('should parse LFO with all parameters', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=5Hz depth=0.8 wave=triangle
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const lfo = result.lfoModules!['kick.amp'];
    expect(lfo).toBeDefined();
    expect(lfo.rateHz).toBe(5);
    expect(lfo.depth).toBe(0.8);
    expect(lfo.wave).toBe('triangle');
    expect(lfo.scope).toBe('instrument');
    expect(lfo.target).toBe('amp');
    expect(lfo.name).toBe('kick');
  });

  it('should parse master LFO', () => {
    const pattern = `TEMPO 120
lfo master.amp: rate=2Hz depth=0.3 wave=sine
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const lfo = result.lfoModules!['master.amp'];
    expect(lfo.scope).toBe('master');
    expect(lfo.name).toBe('master');
  });

  it('should apply LFO defaults', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=1Hz
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    const lfo = result.lfoModules!['kick.amp'];
    expect(lfo.depth).toBe(0.5);    // default
    expect(lfo.wave).toBe('sine');   // default
  });

  it('should clamp LFO rate to 0.1..20', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=0.01Hz depth=0.5
lfo snare.amp: rate=100Hz depth=0.5
seq kick: x...x...x...x...
seq snare: ....x.......x...`;

    const result = PatternParser.parse(pattern);
    expect(result.lfoModules!['kick.amp'].rateHz).toBe(0.1);
    expect(result.lfoModules!['snare.amp'].rateHz).toBe(20);
  });

  it('should clamp LFO depth to 0..1', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=1Hz depth=5
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.lfoModules!['kick.amp'].depth).toBe(1);
  });

  it('should reject invalid LFO wave and default to sine', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=1Hz wave=noise
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.lfoModules!['kick.amp'].wave).toBe('sine');
  });

  it('should support all valid LFO wave types', () => {
    const waves = ['sine', 'triangle', 'square', 'sawtooth'] as const;
    for (const wave of waves) {
      const pattern = `TEMPO 120\nlfo kick.amp: rate=1Hz wave=${wave}\nseq kick: x...x...x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.lfoModules!['kick.amp'].wave).toBe(wave);
    }
  });

  it('should reject LFO without .amp target', () => {
    const pattern = `TEMPO 120
lfo kick.filter: rate=1Hz
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.lfoModules!['kick.filter']).toBeUndefined();
  });

  it('should reject LFO without target separator', () => {
    const pattern = `TEMPO 120
lfo kick: rate=1Hz
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    // No valid key because target is required
    expect(Object.keys(result.lfoModules || {})).toHaveLength(0);
  });
});

describe('PatternParser - SAMPLE Module', () => {
  it('should parse sample assignment', () => {
    const pattern = `TEMPO 120
sample kick: snare
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.sampleModules!.kick).toEqual({
      name: 'kick',
      sample: 'snare',
      gain: undefined,
    });
  });

  it('should parse sample with gain option', () => {
    const pattern = `TEMPO 120
sample kick: hihat gain=2
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.sampleModules!.kick.sample).toBe('hihat');
    expect(result.sampleModules!.kick.gain).toBe(2);
  });

  it('should clamp sample gain to -3..+3', () => {
    const pattern = `TEMPO 120
sample kick: snare gain=10
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.sampleModules!.kick.gain).toBe(3);
  });

  it('should lowercase instrument and sample names', () => {
    const pattern = `TEMPO 120
sample KICK: SNARE
seq kick: x...x...x...x...`;

    const result = PatternParser.parse(pattern);
    expect(result.sampleModules!.kick.name).toBe('kick');
    expect(result.sampleModules!.kick.sample).toBe('snare');
  });
});

describe('PatternParser - Combined Modules', () => {
  it('should parse a pattern with all module types', () => {
    const pattern = `TEMPO 140

sample kick: kick808
eq master: low=1 mid=0 high=-1
amp kick: gain=2
comp master: threshold=-18 ratio=6
lfo master.amp: rate=2Hz depth=0.3 wave=sine

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

    const result = PatternParser.parse(pattern);

    expect(result.tempo).toBe(140);
    expect(Object.keys(result.instruments)).toHaveLength(3);
    expect(result.sampleModules!.kick).toBeDefined();
    expect(result.eqModules!.master).toBeDefined();
    expect(result.ampModules!.kick).toBeDefined();
    expect(result.compModules!.master).toBeDefined();
    expect(result.lfoModules!['master.amp']).toBeDefined();
    expect(result.totalSteps).toBe(16);
  });

  it('should validate a pattern with all module types', () => {
    const pattern = `TEMPO 140
sample kick: kick808
eq master: low=1 mid=0 high=-1
amp kick: gain=2
comp master: threshold=-18 ratio=6
lfo master.amp: rate=2Hz depth=0.3 wave=sine
seq kick: x...x...x...x...
seq snare: ....x.......x...`;

    const validation = PatternParser.validate(pattern);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should not break sequence parsing when modules are interleaved', () => {
    const pattern = `TEMPO 120
seq kick: x...x...x...x...
eq kick: low=2
amp kick: gain=1
seq snare: ....x.......x...
comp master: threshold=-24`;

    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick).toBeDefined();
    expect(result.instruments.snare).toBeDefined();
    expect(result.eqModules!.kick).toBeDefined();
    expect(result.ampModules!.kick).toBeDefined();
    expect(result.compModules!.master).toBeDefined();
  });
});

describe('PatternParser - Edge Cases', () => {
  it('should handle comment lines without errors', () => {
    const pattern = `TEMPO 120
# This is a comment
seq kick: x...x...x...x...
# Another comment
seq snare: ....x.......x...`;

    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick).toBeDefined();
    expect(result.instruments.snare).toBeDefined();
  });

  it('should use default tempo when none is specified', () => {
    const pattern = `seq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.tempo).toBe(120);
  });

  it('should clamp tempo to valid range', () => {
    const lowTempo = `TEMPO 30\nseq kick: x...x...x...x...`;
    const highTempo = `TEMPO 999\nseq kick: x...x...x...x...`;

    expect(PatternParser.parse(lowTempo).tempo).toBe(60);
    expect(PatternParser.parse(highTempo).tempo).toBe(200);
  });

  it('should validate empty pattern', () => {
    const result = PatternParser.validate('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Pattern cannot be empty');
  });

  it('should validate whitespace-only pattern', () => {
    const result = PatternParser.validate('   \n  \n  ');
    expect(result.isValid).toBe(false);
  });

  it('should parse uppercase X in sequences', () => {
    const pattern = `TEMPO 120\nseq kick: X...X...X...X...`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps.filter(Boolean)).toHaveLength(4);
  });

  it('should truncate sequences beyond 32 steps', () => {
    const longSeq = 'x'.repeat(64);
    const pattern = `TEMPO 120\nseq kick: ${longSeq}`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps).toHaveLength(32);
  });

  it('should set totalSteps to at least 16', () => {
    const pattern = `TEMPO 120\nseq kick: x.x.`;
    const result = PatternParser.parse(pattern);
    expect(result.totalSteps).toBe(16);
  });

  it('should use longest instrument for totalSteps when > 16', () => {
    const pattern = `TEMPO 120
seq kick: x...x...x...x...x...x...x...x...
seq snare: ....x...`;
    const result = PatternParser.parse(pattern);
    expect(result.totalSteps).toBe(32);
  });

  it('should handle LFO rate without Hz suffix', () => {
    const pattern = `TEMPO 120
lfo kick.amp: rate=5 depth=0.5
seq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.lfoModules!['kick.amp'].rateHz).toBe(5);
  });

  it('should handle comp with only defaults (no specific params)', () => {
    const pattern = `TEMPO 120
comp master: threshold=-24
seq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    const comp = result.compModules!.master;
    expect(comp.threshold).toBe(-24);
    expect(comp.ratio).toBe(4);
    expect(comp.attack).toBe(0.01);
    expect(comp.release).toBe(0.25);
    expect(comp.knee).toBe(30);
  });

  it('should warn about missing tempo in validation', () => {
    const pattern = `seq kick: x...x...x...x...`;
    const result = PatternParser.validate(pattern);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.includes('No tempo specified'))).toBe(true);
  });

  it('should warn about very short sequences', () => {
    const pattern = `TEMPO 120\nseq kick: x.`;
    const result = PatternParser.validate(pattern);
    expect(result.warnings.some(w => w.includes('very few steps'))).toBe(true);
  });

  it('should reject patterns with invalid sequence characters', () => {
    const pattern = `TEMPO 120\nseq kick: x.!.x...`;
    const result = PatternParser.validate(pattern);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid pattern characters'))).toBe(true);
  });

  it('should report multiple errors simultaneously', () => {
    const pattern = `TEMPO 120
eq : low=2
amp : gain=1`;
    const result = PatternParser.validate(pattern);
    expect(result.isValid).toBe(false);
    // At minimum: invalid eq, invalid amp, no valid sequence
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
