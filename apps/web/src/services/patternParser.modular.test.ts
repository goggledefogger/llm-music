import { describe, it, expect } from 'vitest';
import { PatternParser } from './patternParser';

describe('PatternParser - Envelope (ADSR) Module', () => {
  it('should parse env with all parameters', () => {
    const pattern = `TEMPO 120\nenv kick: attack=0.01 decay=0.1 sustain=0.6 release=0.5\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    const env = result.envelopeModules?.['kick'];
    expect(env).toBeDefined();
    expect(env!.attack).toBe(0.01);
    expect(env!.decay).toBe(0.1);
    expect(env!.sustain).toBe(0.6);
    expect(env!.release).toBe(0.5);
  });

  it('should use defaults for missing env parameters', () => {
    const pattern = `TEMPO 120\nenv kick: attack=0.05\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    const env = result.envelopeModules?.['kick'];
    expect(env).toBeDefined();
    expect(env!.attack).toBe(0.05);
    expect(env!.decay).toBe(0.1);     // default
    expect(env!.sustain).toBe(0.5);   // default
    expect(env!.release).toBe(0.3);   // default
  });

  it('should clamp env attack to valid range', () => {
    const pattern = `TEMPO 120\nenv kick: attack=10\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.envelopeModules!['kick'].attack).toBe(2.0);
  });

  it('should clamp env release to valid range', () => {
    const pattern = `TEMPO 120\nenv kick: release=20\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.envelopeModules!['kick'].release).toBe(5.0);
  });

  it('should clamp env sustain to 0-1', () => {
    const low = PatternParser.parse(`TEMPO 120\nenv kick: sustain=-0.5\nseq kick: x...x...x...x...`);
    const high = PatternParser.parse(`TEMPO 120\nenv kick: sustain=2\nseq kick: x...x...x...x...`);
    expect(low.envelopeModules!['kick'].sustain).toBe(0);
    expect(high.envelopeModules!['kick'].sustain).toBe(1);
  });

  it('should validate env format', () => {
    const valid = PatternParser.validate(`TEMPO 120\nenv kick: attack=0.01 release=0.5\nseq kick: x...x...x...x...`);
    expect(valid.isValid).toBe(true);
  });

  it('should report error for invalid env format', () => {
    const invalid = PatternParser.validate(`TEMPO 120\nenv : attack=0.01\nseq kick: x...x...x...x...`);
    expect(invalid.isValid).toBe(false);
  });
});

describe('PatternParser - Chorus Module', () => {
  it('should parse chorus with all parameters', () => {
    const pattern = `TEMPO 120\nchorus master: rate=1.5 depth=0.4 mix=0.3\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    const chorus = result.chorusModules?.['master'];
    expect(chorus).toBeDefined();
    expect(chorus!.rate).toBe(1.5);
    expect(chorus!.depth).toBe(0.4);
    expect(chorus!.mix).toBe(0.3);
  });

  it('should use defaults for missing chorus parameters', () => {
    const pattern = `TEMPO 120\nchorus master: rate=2\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.chorusModules!['master'].rate).toBe(2);
    expect(result.chorusModules!['master'].depth).toBe(0.4);
    expect(result.chorusModules!['master'].mix).toBe(0.3);
  });

  it('should clamp chorus rate', () => {
    const result = PatternParser.parse(`TEMPO 120\nchorus master: rate=50\nseq kick: x...x...x...x...`);
    expect(result.chorusModules!['master'].rate).toBe(10);
  });

  it('should validate chorus format', () => {
    const valid = PatternParser.validate(`TEMPO 120\nchorus master: rate=1.5\nseq kick: x...x...x...x...`);
    expect(valid.isValid).toBe(true);
  });
});

describe('PatternParser - Phaser Module', () => {
  it('should parse phaser with all parameters', () => {
    const pattern = `TEMPO 120\nphaser master: rate=0.5 depth=0.6 stages=4 mix=0.3\nseq kick: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    const phaser = result.phaserModules?.['master'];
    expect(phaser).toBeDefined();
    expect(phaser!.rate).toBe(0.5);
    expect(phaser!.depth).toBe(0.6);
    expect(phaser!.stages).toBe(4);
    expect(phaser!.mix).toBe(0.3);
  });

  it('should snap stages to nearest valid value', () => {
    const result = PatternParser.parse(`TEMPO 120\nphaser master: stages=5\nseq kick: x...x...x...x...`);
    expect(result.phaserModules!['master'].stages).toBe(4); // snaps to nearest: 4 or 6, 5 is equidistant, reduce prefers 4
  });

  it('should snap stages=10 to 8 or 12', () => {
    const result = PatternParser.parse(`TEMPO 120\nphaser master: stages=10\nseq kick: x...x...x...x...`);
    // 10 is equidistant from 8 and 12. reduce picks first occurrence with same distance
    expect([8, 12]).toContain(result.phaserModules!['master'].stages);
  });

  it('should validate phaser format', () => {
    const valid = PatternParser.validate(`TEMPO 120\nphaser master: rate=0.5 stages=6\nseq kick: x...x...x...x...`);
    expect(valid.isValid).toBe(true);
  });
});

describe('PatternParser - Note Module', () => {
  it('should parse MIDI note number', () => {
    const pattern = `TEMPO 120\nnote bass: 36\nseq bass: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.noteModules?.['bass']).toBeDefined();
    // MIDI 36 = C2 ≈ 65.41 Hz
    expect(result.noteModules!['bass'].pitch).toBeCloseTo(65.41, 1);
  });

  it('should parse MIDI note 69 as A4 = 440Hz', () => {
    const pattern = `TEMPO 120\nnote lead: 69\nseq lead: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.noteModules!['lead'].pitch).toBeCloseTo(440, 0);
  });

  it('should parse Hz format', () => {
    const pattern = `TEMPO 120\nnote bass: 110hz\nseq bass: x...x...x...x...`;
    const result = PatternParser.parse(pattern);
    expect(result.noteModules!['bass'].pitch).toBe(110);
  });

  it('should clamp Hz to valid range', () => {
    const low = PatternParser.parse(`TEMPO 120\nnote bass: 5hz\nseq bass: x...x...x...x...`);
    const high = PatternParser.parse(`TEMPO 120\nnote bass: 50000hz\nseq bass: x...x...x...x...`);
    expect(low.noteModules!['bass'].pitch).toBe(20);
    expect(high.noteModules!['bass'].pitch).toBe(20000);
  });

  it('should clamp MIDI note to 0-127', () => {
    const result = PatternParser.parse(`TEMPO 120\nnote bass: 200\nseq bass: x...x...x...x...`);
    // MIDI 127 = ~12543.85 Hz
    expect(result.noteModules!['bass'].pitch).toBeCloseTo(12543.85, 0);
  });

  it('should return null for invalid note string', () => {
    const result = PatternParser.parse(`TEMPO 120\nnote bass: invalid\nseq bass: x...x...x...x...`);
    expect(result.noteModules?.['bass']).toBeUndefined();
  });

  it('should validate note format', () => {
    const valid = PatternParser.validate(`TEMPO 120\nnote bass: 36\nseq bass: x...x...x...x...`);
    expect(valid.isValid).toBe(true);
  });

  it('should report error for invalid note value', () => {
    const invalid = PatternParser.validate(`TEMPO 120\nnote bass: invalid\nseq bass: x...x...x...x...`);
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some(e => e.includes('note'))).toBe(true);
  });
});

describe('PatternParser - Velocity (X/x/o)', () => {
  it('should parse X as accent (velocity 1.0)', () => {
    const pattern = `TEMPO 120\nseq kick: X...`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps[0]).toBe(true);
    expect(result.instruments.kick.velocities![0]).toBe(1.0);
  });

  it('should parse x as normal (velocity 0.7)', () => {
    const pattern = `TEMPO 120\nseq kick: x...`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps[0]).toBe(true);
    expect(result.instruments.kick.velocities![0]).toBe(0.7);
  });

  it('should parse o as ghost note (velocity 0.3)', () => {
    const pattern = `TEMPO 120\nseq kick: o...`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps[0]).toBe(true);
    expect(result.instruments.kick.velocities![0]).toBe(0.3);
  });

  it('should parse . as rest (velocity 0)', () => {
    const pattern = `TEMPO 120\nseq kick: .x..`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.kick.steps[0]).toBe(false);
    expect(result.instruments.kick.velocities![0]).toBe(0);
  });

  it('should handle mixed velocity pattern', () => {
    const pattern = `TEMPO 120\nseq kick: X.x.o.x.`;
    const result = PatternParser.parse(pattern);
    const v = result.instruments.kick.velocities;
    expect(v).toEqual([1.0, 0, 0.7, 0, 0.3, 0, 0.7, 0]);
  });

  it('should validate patterns with o character', () => {
    const valid = PatternParser.validate(`TEMPO 120\nseq kick: X.x.o.x.`);
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it('should still have velocities array same length as steps', () => {
    const pattern = `TEMPO 120\nseq a: x.X.o.x.x.X.o.x.x.X.o.x.`;
    const result = PatternParser.parse(pattern);
    expect(result.instruments.a.velocities!.length).toBe(result.instruments.a.steps.length);
  });
});

describe('PatternParser - Combined New Modules', () => {
  it('should parse a pattern with all new module types', () => {
    const pattern = `TEMPO 140
env kick: attack=0.01 decay=0.1 sustain=0.6 release=1.0
env snare: attack=0.005 decay=0.08 sustain=0.3 release=0.3
note bass: 36
chorus master: rate=1.5 depth=0.4 mix=0.3
phaser master: rate=0.5 depth=0.6 stages=4 mix=0.2
delay snare: time=0.375 feedback=0.3 mix=0.4
reverb hihat: mix=0.5 decay=1.5

seq kick: X...x...o...x...
seq snare: ....X.......o...
seq hihat: x.x.x.x.x.x.x.x.
seq bass: x...x...x...x...`;

    const result = PatternParser.parse(pattern);

    expect(result.tempo).toBe(140);
    expect(Object.keys(result.instruments)).toHaveLength(4);

    expect(result.envelopeModules?.['kick']).toBeDefined();
    expect(result.envelopeModules?.['snare']).toBeDefined();
    expect(result.noteModules?.['bass']).toBeDefined();
    expect(result.chorusModules?.['master']).toBeDefined();
    expect(result.phaserModules?.['master']).toBeDefined();
    expect(result.delayModules?.['snare']).toBeDefined();
    expect(result.reverbModules?.['hihat']).toBeDefined();

    // Verify velocities on kick
    expect(result.instruments.kick.velocities![0]).toBe(1.0);  // X
    expect(result.instruments.kick.velocities![4]).toBe(0.7);  // x
    expect(result.instruments.kick.velocities![8]).toBe(0.3);  // o
  });

  it('should validate combined pattern with all new modules', () => {
    const pattern = `TEMPO 130
env kick: attack=0.01 release=1.0
note bass: 60
chorus master: rate=2 mix=0.4
phaser master: rate=0.3 stages=6 mix=0.2
seq kick: X...x...o...x...
seq bass: x...x...x...x...`;

    const validation = PatternParser.validate(pattern);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should work with existing EQ, AMP, COMP, and LFO alongside new modules', () => {
    const pattern = `TEMPO 120
eq master: low=2 mid=-1 high=1
amp master: gain=2
comp master: threshold=-20 ratio=4
lfo master.amp: rate=2Hz depth=0.3 wave=sine
env kick: attack=0.01 decay=0.1 sustain=0.5 release=0.8
note bass: 42
chorus master: rate=1 mix=0.2
seq kick: X...x...
seq bass: x.x.x.x.`;

    const result = PatternParser.parse(pattern);
    expect(result.eqModules?.['master']).toBeDefined();
    expect(result.ampModules?.['master']).toBeDefined();
    expect(result.compModules?.['master']).toBeDefined();
    expect(result.lfoModules?.['master.amp']).toBeDefined();
    expect(result.envelopeModules?.['kick']).toBeDefined();
    expect(result.noteModules?.['bass']).toBeDefined();
    expect(result.chorusModules?.['master']).toBeDefined();
  });
});
