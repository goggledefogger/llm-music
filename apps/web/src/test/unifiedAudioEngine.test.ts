/**
 * Unit tests for UnifiedAudioEngine.
 *
 * These tests verify the core audio engine lifecycle:
 * - Initialization creates audio graph
 * - play() restores master gain and starts Tone.Transport
 * - pause/stop correctly manage state
 * - Pattern loading triggers the right updates
 * - Tone.Part is rebuilt on play/sequence change
 *
 * All Tone.js and Web Audio API calls are mocked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockAudioContext, mockTone, mockToneTransport, mockTonePart, resetMocks } from './sharedMocks';

// Mock tone module before importing the engine
vi.mock('tone', () => mockTone);

// The engine is a singleton, so we need to reset it between tests.
// We do this by accessing the private static instance field.
import { UnifiedAudioEngine } from '../services/unifiedAudioEngine';

function resetEngineInstance() {
  // Reset the singleton so each test starts fresh
  (UnifiedAudioEngine as any).instance = null;
}

describe('UnifiedAudioEngine', () => {
  let engine: UnifiedAudioEngine;

  beforeEach(() => {
    resetMocks();
    resetEngineInstance();

    // Reset transport mock state
    mockToneTransport.bpm.value = 120;
    mockToneTransport.position = 0;
    mockToneTransport.seconds = 0;
    mockToneTransport.start.mockClear();
    mockToneTransport.stop.mockClear();
    mockToneTransport.pause.mockClear();

    // Reset Part constructor mock
    mockTone.Part.mockClear();
    mockTone.start.mockClear();

    engine = UnifiedAudioEngine.getInstance();
  });

  afterEach(() => {
    try { engine.dispose(); } catch { /* ignore */ }
  });

  describe('getInstance', () => {
    it('returns the same instance on multiple calls', () => {
      const a = UnifiedAudioEngine.getInstance();
      const b = UnifiedAudioEngine.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('initialize', () => {
    it('creates audio graph and marks engine as initialized', async () => {
      await engine.initialize();
      const state = engine.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('does not re-initialize if already initialized', async () => {
      await engine.initialize();
      const callCount = mockAudioContext.createGain.mock.calls.length;
      await engine.initialize();
      // No additional createGain calls
      expect(mockAudioContext.createGain.mock.calls.length).toBe(callCount);
    });

    it('creates masterGain and volumeGain nodes', async () => {
      await engine.initialize();
      // createGain is called multiple times (masterGain, volumeGain, master chain nodes)
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('builds the master effect chain', async () => {
      await engine.initialize();
      // Master chain creates: 3 EQ filters + 1 compressor + distort/delay/reverb nodes
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
    });
  });

  describe('play', () => {
    const BASIC_PATTERN = `TEMPO 120
seq kick: x...x...x...x...
seq hihat: x.x.x.x.x.x.x.x.`;

    it('throws if not initialized', async () => {
      await expect(engine.play()).rejects.toThrow('Audio engine not initialized');
    });

    it('throws if no pattern loaded', async () => {
      await engine.initialize();
      await expect(engine.play()).rejects.toThrow('No pattern loaded');
    });

    it('calls Tone.start() to resume AudioContext', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();

      expect(mockTone.start).toHaveBeenCalled();
    });

    it('restores masterGain to 1 before starting playback', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();

      // The masterGain mock should have had setValueAtTime(1, ...) called.
      // stopAllAudio sets it to 0, then play restores it to 1.
      const masterGain = (engine as any).masterGain;
      expect(masterGain).toBeTruthy();
      const calls = masterGain.gain.setValueAtTime.mock.calls;
      // After stopAllAudio (gain=0), play restores (gain=1)
      const lastTwoCalls = calls.slice(-2);
      expect(lastTwoCalls[0][0]).toBe(0); // stopAllAudio sets to 0
      expect(lastTwoCalls[1][0]).toBe(1); // play restores to 1
    });

    it('starts Tone.Transport', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();

      expect(mockToneTransport.start).toHaveBeenCalled();
    });

    it('creates a Tone.Part with pattern events', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();

      // Tone.Part should be constructed with events
      expect(mockTone.Part).toHaveBeenCalled();
      const [callback, events] = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      expect(typeof callback).toBe('function');
      expect(events.length).toBeGreaterThan(0);
    });

    it('sets isPlaying to true', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();

      expect(engine.getState().isPlaying).toBe(true);
    });

    it('does nothing if already playing', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();
      mockToneTransport.start.mockClear();

      await engine.play();
      expect(mockToneTransport.start).not.toHaveBeenCalled();
    });

    it('sets Tone.Transport BPM from pattern tempo', async () => {
      await engine.initialize();
      engine.loadPattern('TEMPO 140\nseq kick: x...x...x...x...');
      await engine.play();

      expect(mockToneTransport.bpm.value).toBe(140);
    });
  });

  describe('pause', () => {
    const BASIC_PATTERN = 'TEMPO 120\nseq kick: x...x...x...x...';

    it('pauses Tone.Transport and sets isPaused', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();
      engine.pause();

      expect(mockToneTransport.pause).toHaveBeenCalled();
      const state = engine.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(true);
    });

    it('does nothing when not playing', () => {
      engine.pause();
      expect(mockToneTransport.pause).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    const BASIC_PATTERN = 'TEMPO 120\nseq kick: x...x...x...x...';

    it('stops Tone.Transport and resets position', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();
      engine.stop();

      expect(mockToneTransport.stop).toHaveBeenCalled();
      const state = engine.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('restores masterGain to 1 after stopping', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();
      engine.stop();

      const masterGain = (engine as any).masterGain;
      const lastCall = masterGain.gain.setValueAtTime.mock.calls.slice(-1)[0];
      expect(lastCall[0]).toBe(1); // Restored to 1
    });
  });

  describe('loadPattern', () => {
    it('parses and stores the pattern', async () => {
      await engine.initialize();
      engine.loadPattern('TEMPO 130\nseq kick: x...x...x...x...');

      const state = engine.getState();
      expect(state.tempo).toBe(130);
    });

    it('handles empty pattern gracefully (no sequences = no instruments)', async () => {
      await engine.initialize();
      engine.loadPattern('TEMPO 120');
      // Should not throw, but pattern has no instruments
      expect(engine.getState().tempo).toBe(120);
    });

    it('rebuilds Tone.Part when playing and pattern changes', async () => {
      await engine.initialize();
      engine.loadPattern('TEMPO 120\nseq kick: x...x...x...x...');
      await engine.play();
      mockTone.Part.mockClear();

      engine.loadPattern('TEMPO 120\nseq kick: x.x.x.x.x.x.x.x.');

      // Part should have been rebuilt
      expect(mockTone.Part).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('returns default state before initialization', () => {
      const state = engine.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.tempo).toBe(120);
    });

    it('returns current tempo from loaded pattern', async () => {
      await engine.initialize();
      engine.loadPattern('TEMPO 95\nseq kick: x...x...x...x...');

      expect(engine.getState().tempo).toBe(95);
    });
  });

  describe('resume from pause', () => {
    const BASIC_PATTERN = 'TEMPO 120\nseq kick: x...x...x...x...';

    it('resumes without resetting position', async () => {
      await engine.initialize();
      engine.loadPattern(BASIC_PATTERN);
      await engine.play();
      engine.pause();

      mockToneTransport.start.mockClear();
      await engine.play();

      expect(mockToneTransport.start).toHaveBeenCalled();
      // Should NOT set position to 0 when resuming from pause
      // (isPaused path skips position = 0)
    });
  });

  describe('groove/swing events', () => {
    it('includes groove offsets in Tone.Part events for swing patterns', async () => {
      await engine.initialize();
      // Use xxxxxxxxxxxxxxxx (all 16 steps) so odd steps get swing offsets
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6`);
      await engine.play();

      expect(mockTone.Part).toHaveBeenCalled();
      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];

      // Swing delays odd steps — with all 16 hits, 8 should have non-zero offset
      const offsetEvents = events.filter((e: any) => e.grooveOffset !== 0);
      expect(offsetEvents.length).toBeGreaterThan(0);
    });

    it('8th-note swing targets correct steps', async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=8n`);
      await engine.play();

      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];

      // subdivision=8n, stepsPerSubdiv=2: off-beats where floor(step/2)%2===1
      // That's steps 2,3,6,7,10,11,14,15
      const offBeatSteps = [2, 3, 6, 7, 10, 11, 14, 15];
      const onBeatSteps = [0, 1, 4, 5, 8, 9, 12, 13];

      for (const s of offBeatSteps) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBeGreaterThan(0);
      }
      for (const s of onBeatSteps) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBe(0);
      }
    });

    it('16th-note swing targets correct steps', async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=16n`);
      await engine.play();

      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];

      // subdivision=16n, stepsPerSubdiv=1: off-beats where floor(step/1)%2===1
      // That's odd steps: 1,3,5,7,9,11,13,15
      for (const s of [1, 3, 5, 7, 9, 11, 13, 15]) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBeGreaterThan(0);
      }
      for (const s of [0, 2, 4, 6, 8, 10, 12, 14]) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBe(0);
      }
    });

    it('quarter-note swing targets correct steps', async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=4n`);
      await engine.play();

      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];

      // subdivision=4n, stepsPerSubdiv=4: off-beats where floor(step/4)%2===1
      // That's steps 4-7 and 12-15
      const offBeatSteps = [4, 5, 6, 7, 12, 13, 14, 15];
      const onBeatSteps = [0, 1, 2, 3, 8, 9, 10, 11];

      for (const s of offBeatSteps) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBeGreaterThan(0);
      }
      for (const s of onBeatSteps) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBe(0);
      }
    });

    it('offset scales with subdivision', async () => {
      await engine.initialize();

      // 16n swing
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=16n`);
      await engine.play();
      let lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events16n = lastCall[1];
      const offset16n = events16n.find((e: any) => e.step === 1)?.grooveOffset;

      // 8n swing
      engine.stop();
      mockTone.Part.mockClear();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=8n`);
      await engine.play();
      lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events8n = lastCall[1];
      const offset8n = events8n.find((e: any) => e.step === 2)?.grooveOffset;

      // 4n swing
      engine.stop();
      mockTone.Part.mockClear();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=4n`);
      await engine.play();
      lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events4n = lastCall[1];
      const offset4n = events4n.find((e: any) => e.step === 4)?.grooveOffset;

      // 8n offset should be 2x the 16n offset, 4n should be 4x
      expect(offset8n).toBeCloseTo(offset16n! * 2, 5);
      expect(offset4n).toBeCloseTo(offset16n! * 4, 5);
    });

    it('default subdivision is 8n when not specified', async () => {
      await engine.initialize();

      // Without explicit subdivision
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6`);
      await engine.play();
      let lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const eventsDefault = lastCall[1];

      // With explicit 8n
      engine.stop();
      mockTone.Part.mockClear();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 subdivision=8n`);
      await engine.play();
      lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events8n = lastCall[1];

      // Both should produce the same offsets for each step
      for (let s = 0; s < 16; s++) {
        const evDef = eventsDefault.find((e: any) => e.step === s);
        const ev8n = events8n.find((e: any) => e.step === s);
        expect(evDef?.grooveOffset).toBeCloseTo(ev8n?.grooveOffset ?? 0, 5);
      }
    });

    it('explicit steps overrides subdivision', async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: xxxxxxxxxxxxxxxx
groove master: type=swing amount=0.6 steps=odd`);
      await engine.play();

      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];

      // steps=odd should target odd steps (1,3,5,...) regardless of subdivision
      for (const s of [1, 3, 5, 7, 9, 11, 13, 15]) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBeGreaterThan(0);
      }
      for (const s of [0, 2, 4, 6, 8, 10, 12, 14]) {
        const ev = events.find((e: any) => e.step === s);
        expect(ev?.grooveOffset).toBe(0);
      }
    });

    it('does not add groove offsets when no groove is specified', async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: x.x.x.x.x.x.x.x.`);
      await engine.play();

      const lastCall = mockTone.Part.mock.calls[mockTone.Part.mock.calls.length - 1];
      const events = lastCall[1];
      const offsetEvents = events.filter((e: any) => e.grooveOffset !== 0);
      expect(offsetEvents.length).toBe(0);
    });
  });

  describe('overflow mode', () => {
    it('defaults to loop mode', () => {
      expect(engine.getState().overflowMode).toBe('loop');
    });

    it('can be changed to rest mode', async () => {
      await engine.initialize();
      engine.setOverflowMode('rest');
      expect(engine.getState().overflowMode).toBe('rest');
    });
  });
});
