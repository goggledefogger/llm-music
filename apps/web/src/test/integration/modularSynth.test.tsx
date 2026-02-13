import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternParser } from '../../services/patternParser';

/**
 * Integration tests for the modular synth features.
 * Tests the full DSL → Parser → ParsedPattern pipeline for:
 * - ADSR envelopes (env keyword)
 * - Velocity-sensitive patterns (X/x/o)
 * - Chorus, Phaser effects
 * - Note/pitch assignments
 * - Per-instrument delay/reverb
 * - New procedural samples
 * - Combined feature interactions
 *
 * Following the existing test patterns from audioEngine.test.tsx
 * and workflow.test.tsx.
 */

describe('Modular Synth Integration Tests', () => {

  describe('Full Pattern → ParsedPattern Pipeline', () => {
    it('should parse a complete modular synth pattern with all new features', () => {
      const pattern = `TEMPO 140
env kick: attack=0.01 decay=0.1 sustain=0.6 release=1.0
env snare: attack=0.005 decay=0.08 sustain=0.3 release=0.3
note bass: 36
sample hat: openhat
sample cow: cowbell
chorus master: rate=1.5 depth=0.4 mix=0.3
phaser master: rate=0.5 depth=0.6 stages=4 mix=0.2
delay snare: time=0.375 feedback=0.3 mix=0.4
reverb hat: mix=0.5 decay=1.5
eq master: low=2 mid=-1 high=1
amp master: gain=2
lfo master.amp: rate=2Hz depth=0.3 wave=sine

seq kick: X...x...o...x...
seq snare: ....X.......o...
seq hat: x.x.x.x.x.x.x.x.
seq bass: x...x...x...x...
seq cow: x.......x.......`;

      const result = PatternParser.parse(pattern);

      // Core structure
      expect(result.tempo).toBe(140);
      expect(Object.keys(result.instruments)).toHaveLength(5);
      expect(result.totalSteps).toBe(16);

      // Envelope modules
      expect(result.envelopeModules!['kick']).toEqual({
        name: 'kick', attack: 0.01, decay: 0.1, sustain: 0.6, release: 1.0
      });
      expect(result.envelopeModules!['snare']).toEqual({
        name: 'snare', attack: 0.005, decay: 0.08, sustain: 0.3, release: 0.3
      });

      // Note modules (MIDI 36 = C2 ≈ 65.41Hz)
      expect(result.noteModules!['bass']).toBeDefined();
      expect(result.noteModules!['bass'].pitch).toBeCloseTo(65.41, 1);

      // Sample assignments (new samples)
      expect(result.sampleModules!['hat'].sample).toBe('openhat');
      expect(result.sampleModules!['cow'].sample).toBe('cowbell');

      // Chorus on master
      expect(result.chorusModules!['master']).toEqual({
        name: 'master', rate: 1.5, depth: 0.4, mix: 0.3
      });

      // Phaser on master
      expect(result.phaserModules!['master']).toEqual({
        name: 'master', rate: 0.5, depth: 0.6, stages: 4, mix: 0.2
      });

      // Per-instrument delay (not master!)
      expect(result.delayModules!['snare']).toBeDefined();
      expect(result.delayModules!['snare'].time).toBe(0.375);
      expect(result.delayModules!['snare'].feedback).toBe(0.3);

      // Per-instrument reverb
      expect(result.reverbModules!['hat']).toBeDefined();
      expect(result.reverbModules!['hat'].mix).toBe(0.5);

      // Legacy modules still work
      expect(result.eqModules!['master']).toBeDefined();
      expect(result.ampModules!['master']).toBeDefined();
      expect(result.lfoModules!['master.amp']).toBeDefined();

      // Velocity on kick: X=1.0, x=0.7, o=0.3
      const kickVel = result.instruments.kick.velocities!;
      expect(kickVel[0]).toBe(1.0);   // X
      expect(kickVel[1]).toBe(0);     // .
      expect(kickVel[4]).toBe(0.7);   // x
      expect(kickVel[8]).toBe(0.3);   // o
      expect(kickVel[12]).toBe(0.7);  // x

      // Velocity on snare
      const snareVel = result.instruments.snare.velocities!;
      expect(snareVel[4]).toBe(1.0);  // X
      expect(snareVel[12]).toBe(0.3); // o
    });

    it('should validate a full modular pattern without errors', () => {
      const pattern = `TEMPO 130
env kick: attack=0.01 decay=0.1 sustain=0.5 release=0.8
env snare: attack=0.005 release=0.3
note bass: 42
sample hat: openhat
chorus master: rate=2 depth=0.5 mix=0.3
phaser master: rate=0.3 stages=6 mix=0.2
delay snare: time=0.25 feedback=0.4 mix=0.5
reverb hat: mix=0.4 decay=2.0
seq kick: X...x...o...x...
seq snare: ....X.......o...
seq hat: x.x.x.x.x.x.x.x.
seq bass: x...x...x...x...`;

      const validation = PatternParser.validate(pattern);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validInstruments).toContain('kick');
      expect(validation.validInstruments).toContain('snare');
      expect(validation.validInstruments).toContain('hat');
      expect(validation.validInstruments).toContain('bass');
    });
  });

  describe('ADSR Envelope → Long Release Tails', () => {
    it('should support release values up to 5 seconds for long tails', () => {
      const result = PatternParser.parse(
        `TEMPO 120\nenv pad: attack=0.5 decay=0.3 sustain=0.8 release=5.0\nseq pad: X...............`
      );
      expect(result.envelopeModules!['pad'].release).toBe(5.0);
      expect(result.envelopeModules!['pad'].attack).toBe(0.5);
    });

    it('should clamp over-range ADSR values correctly', () => {
      const result = PatternParser.parse(
        `TEMPO 120\nenv kick: attack=10 decay=10 sustain=5 release=20\nseq kick: x...`
      );
      expect(result.envelopeModules!['kick'].attack).toBe(2.0);
      expect(result.envelopeModules!['kick'].decay).toBe(2.0);
      expect(result.envelopeModules!['kick'].sustain).toBe(1);
      expect(result.envelopeModules!['kick'].release).toBe(5.0);
    });

    it('should allow different envelopes per instrument', () => {
      const result = PatternParser.parse(`TEMPO 120
env kick: attack=0.01 release=0.2
env snare: attack=0.005 release=0.5
env pad: attack=0.3 release=3.0
seq kick: x...x...
seq snare: ....x...
seq pad: x.......`);

      expect(result.envelopeModules!['kick'].release).toBe(0.2);
      expect(result.envelopeModules!['snare'].release).toBe(0.5);
      expect(result.envelopeModules!['pad'].release).toBe(3.0);
    });
  });

  describe('Velocity Dynamics', () => {
    it('should produce full velocity array matching step length', () => {
      const result = PatternParser.parse(`TEMPO 120\nseq perc: X.x.o.x.X.x.o.x.`);
      const inst = result.instruments.perc;
      expect(inst.steps).toHaveLength(16);
      expect(inst.velocities).toHaveLength(16);
    });

    it('should differentiate all three velocity levels', () => {
      const result = PatternParser.parse(`TEMPO 120\nseq drum: Xxo.`);
      const v = result.instruments.drum.velocities!;
      expect(v[0]).toBeGreaterThan(v[1]); // X > x
      expect(v[1]).toBeGreaterThan(v[2]); // x > o
      expect(v[2]).toBeGreaterThan(v[3]); // o > .
    });

    it('should preserve velocity across pattern repetition lengths', () => {
      const result = PatternParser.parse(`TEMPO 120\nseq a: Xxo.Xxo.Xxo.Xxo.Xxo.Xxo.Xxo.Xxo.`);
      // Truncated to MAX_STEPS (32)
      const v = result.instruments.a.velocities!;
      expect(v).toHaveLength(32);
      // Pattern should repeat: 1.0, 0.7, 0.3, 0
      expect(v[0]).toBe(1.0);
      expect(v[4]).toBe(1.0);
      expect(v[28]).toBe(1.0);
    });
  });

  describe('New Sample Types', () => {
    const newSamples = ['kick808', 'rim', 'tom', 'cowbell', 'shaker', 'crash', 'openhat', 'perc'];

    it.each(newSamples)('should accept sample assignment for %s', (sampleName) => {
      const pattern = `TEMPO 120\nsample inst: ${sampleName}\nseq inst: x...x...`;
      const result = PatternParser.parse(pattern);
      expect(result.sampleModules!['inst'].sample).toBe(sampleName);
    });

    it.each(newSamples)('should validate pattern with %s sample', (sampleName) => {
      const pattern = `TEMPO 120\nsample inst: ${sampleName}\nseq inst: x...x...`;
      const validation = PatternParser.validate(pattern);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Per-Instrument Effects Routing', () => {
    it('should route delay only to specified instrument', () => {
      const result = PatternParser.parse(`TEMPO 120
delay snare: time=0.375 feedback=0.3 mix=0.4
seq kick: x...x...
seq snare: ....x...`);

      expect(result.delayModules!['snare']).toBeDefined();
      expect(result.delayModules!['kick']).toBeUndefined();
    });

    it('should route reverb only to specified instrument', () => {
      const result = PatternParser.parse(`TEMPO 120
reverb hat: mix=0.5 decay=1.5
seq kick: x...x...
seq hat: x.x.x.x.`);

      expect(result.reverbModules!['hat']).toBeDefined();
      expect(result.reverbModules!['kick']).toBeUndefined();
    });

    it('should allow both per-instrument and master effects simultaneously', () => {
      const result = PatternParser.parse(`TEMPO 120
delay master: time=0.25 feedback=0.2 mix=0.2
delay snare: time=0.375 feedback=0.5 mix=0.6
reverb master: mix=0.3 decay=2
reverb hat: mix=0.7 decay=1.5
seq kick: x...x...
seq snare: ....x...
seq hat: x.x.x.x.`);

      expect(result.delayModules!['master']).toBeDefined();
      expect(result.delayModules!['snare']).toBeDefined();
      expect(result.delayModules!['master'].mix).toBe(0.2);
      expect(result.delayModules!['snare'].mix).toBe(0.6);
      expect(result.reverbModules!['master'].mix).toBe(0.3);
      expect(result.reverbModules!['hat'].mix).toBe(0.7);
    });
  });

  describe('Note/Pitch System', () => {
    it('should convert MIDI notes to correct Hz', () => {
      // A4 = MIDI 69 = 440Hz
      const r69 = PatternParser.parse(`TEMPO 120\nnote lead: 69\nseq lead: x...`);
      expect(r69.noteModules!['lead'].pitch).toBeCloseTo(440, 0);

      // C4 = MIDI 60 ≈ 261.63Hz
      const r60 = PatternParser.parse(`TEMPO 120\nnote lead: 60\nseq lead: x...`);
      expect(r60.noteModules!['lead'].pitch).toBeCloseTo(261.63, 1);

      // C2 = MIDI 36 ≈ 65.41Hz
      const r36 = PatternParser.parse(`TEMPO 120\nnote bass: 36\nseq bass: x...`);
      expect(r36.noteModules!['bass'].pitch).toBeCloseTo(65.41, 1);
    });

    it('should accept Hz notation directly', () => {
      const result = PatternParser.parse(`TEMPO 120\nnote sub: 55hz\nseq sub: x...`);
      expect(result.noteModules!['sub'].pitch).toBe(55);
    });

    it('should support multiple pitched instruments', () => {
      const result = PatternParser.parse(`TEMPO 120
note bass: 36
note lead: 69
note pad: 440hz
seq bass: x...x...
seq lead: ....x...
seq pad: x.......`);

      expect(Object.keys(result.noteModules!)).toHaveLength(3);
      expect(result.noteModules!['bass'].pitch).toBeCloseTo(65.41, 1);
      expect(result.noteModules!['lead'].pitch).toBeCloseTo(440, 0);
      expect(result.noteModules!['pad'].pitch).toBe(440);
    });
  });

  describe('Error Detection and Robustness', () => {
    it('should report invalid note values', () => {
      const v = PatternParser.validate(`TEMPO 120\nnote bass: blah\nseq bass: x...`);
      expect(v.isValid).toBe(false);
      expect(v.errors.some(e => e.toLowerCase().includes('note'))).toBe(true);
    });

    it('should report invalid env format', () => {
      const v = PatternParser.validate(`TEMPO 120\nenv : attack=0.01\nseq kick: x...`);
      expect(v.isValid).toBe(false);
    });

    it('should accept o character in sequences', () => {
      const v = PatternParser.validate(`TEMPO 120\nseq kick: XxoXxo..`);
      expect(v.isValid).toBe(true);
    });

    it('should still reject truly invalid characters', () => {
      const v = PatternParser.validate(`TEMPO 120\nseq kick: x!@#x...`);
      expect(v.isValid).toBe(false);
    });

    it('should gracefully handle empty env params', () => {
      const result = PatternParser.parse(`TEMPO 120\nenv kick:\nseq kick: x...`);
      // Should not crash — env may be undefined if parse fails
      expect(result.instruments.kick).toBeDefined();
    });
  });
});
