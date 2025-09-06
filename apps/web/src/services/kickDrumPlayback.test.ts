import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioEngine } from './audioEngine';
import { PatternParser } from './patternParser';

// Mock Tone.js with more detailed mocking for kick drum testing
const mockTransport = {
  bpm: { value: 120 },
  seconds: 0,
  start: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  schedule: vi.fn(() => 1), // Return mock event ID
  clear: vi.fn()
};

const mockKickSynth = {
  connect: vi.fn(),
  triggerAttackRelease: vi.fn(),
  dispose: vi.fn()
};

const mockSnareSynth = {
  connect: vi.fn(),
  triggerAttackRelease: vi.fn(),
  dispose: vi.fn()
};

const mockHihatSynth = {
  connect: vi.fn(),
  triggerAttackRelease: vi.fn(),
  dispose: vi.fn()
};

const mockVolume = {
  volume: { value: -6 },
  connect: vi.fn(),
  toDestination: vi.fn(),
  dispose: vi.fn()
};

vi.mock('tone', () => ({
  default: {
    getTransport: vi.fn(() => mockTransport),
    start: vi.fn(() => Promise.resolve()),
    MembraneSynth: vi.fn(() => mockKickSynth),
    NoiseSynth: vi.fn(() => mockSnareSynth),
    MetalSynth: vi.fn(() => mockHihatSynth),
    Volume: vi.fn(() => mockVolume)
  },
  getTransport: vi.fn(() => mockTransport),
  start: vi.fn(() => Promise.resolve()),
  MembraneSynth: vi.fn(() => mockKickSynth),
  NoiseSynth: vi.fn(() => mockSnareSynth),
  MetalSynth: vi.fn(() => mockHihatSynth),
  Volume: vi.fn(() => mockVolume)
}));

describe('Kick Drum Pattern Playback', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = new AudioEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (audioEngine) {
      audioEngine.dispose();
    }
  });

  describe('Single Kick Drum Pattern', () => {
    it('should parse a simple kick drum pattern correctly', () => {
      const patternString = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      const parsed = PatternParser.parse(patternString);

      expect(parsed.tempo).toBe(120);
      expect(parsed.instruments.kick).toBeDefined();
      expect(parsed.instruments.kick.steps).toEqual([
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false,  // x...
        true, false, false, false   // x...
      ]);
      expect(parsed.totalSteps).toBe(16);
    });

    it('should schedule kick drum hits when playing', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      audioEngine.loadPattern(patternString);

      // Start playback
      audioEngine.play();

      // Verify that transport.schedule was called
      expect(mockTransport.schedule).toHaveBeenCalled();

      // Get the scheduled function calls
      const scheduleCalls = mockTransport.schedule.mock.calls;

      // Should have scheduled events for kick hits and loop
      expect(scheduleCalls.length).toBeGreaterThan(0);

      // Verify kick hits are scheduled at correct times (every 4 steps = 2 seconds at 120 BPM)
      const kickHitTimes = scheduleCalls
        .filter(call => call[1] !== undefined) // Filter out loop scheduling
        .map(call => call[1]); // Get the time parameter

      expect(kickHitTimes).toContain(0); // First hit at time 0
      expect(kickHitTimes).toContain(2); // Second hit at time 2
      expect(kickHitTimes).toContain(4); // Third hit at time 4
      expect(kickHitTimes).toContain(6); // Fourth hit at time 6
    });

    it('should trigger kick synthesizer when scheduled', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      audioEngine.loadPattern(patternString);

      audioEngine.play();

      // Get the scheduled callback functions
      const scheduleCalls = mockTransport.schedule.mock.calls;
      const kickCallbacks = scheduleCalls
        .filter(call => call[1] !== undefined) // Filter out loop scheduling
        .map(call => call[0]); // Get the callback function

      // Execute the first kick callback
      if (kickCallbacks.length > 0) {
        kickCallbacks[0](0); // Execute with time 0

        // Verify kick synthesizer was triggered
        expect(mockKickSynth.triggerAttackRelease).toHaveBeenCalledWith('C1', '8n');
      }
    });

    it('should handle a single kick drum hit pattern', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 120\n\nseq kick: x...............';
      audioEngine.loadPattern(patternString);

      audioEngine.play();

      // Should schedule kick hit at time 0 and loop at time 8 (16 steps * 0.5 seconds)
      const scheduleCalls = mockTransport.schedule.mock.calls;
      const kickHitTimes = scheduleCalls
        .filter(call => call[1] !== undefined)
        .map(call => call[1]);

      expect(kickHitTimes).toContain(0); // First kick hit
      expect(kickHitTimes.length).toBeGreaterThan(0);
    });

    it('should handle kick drum pattern with different tempos', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 140\n\nseq kick: x...x...x...x...';
      audioEngine.loadPattern(patternString);

      audioEngine.play();

      // Verify tempo was set correctly
      expect(mockTransport.bpm.value).toBe(140);
    });
  });

  describe('Kick Drum with Other Instruments', () => {
    it('should play kick drum in a multi-instrument pattern', async () => {
      await audioEngine.initialize();

      const patternString = `TEMPO 120

seq kick: x...x...x...x...
seq snare: ..x...x...x...x.
seq hihat: x.x.x.x.x.x.x.x.`;

      audioEngine.loadPattern(patternString);
      audioEngine.play();

      // Should schedule events for all instruments
      const scheduleCalls = mockTransport.schedule.mock.calls;
      expect(scheduleCalls.length).toBeGreaterThan(0);

      // Verify kick hits are still scheduled correctly
      const kickHitTimes = scheduleCalls
        .filter(call => call[1] !== undefined)
        .map(call => call[1]);

      expect(kickHitTimes).toContain(0); // First kick hit
      expect(kickHitTimes).toContain(2); // Second kick hit
    });

    it('should trigger correct synthesizer for kick drum', async () => {
      await audioEngine.initialize();

      const patternString = `TEMPO 120

seq kick: x...x...x...x...
seq snare: ..x...x...x...x.`;

      audioEngine.loadPattern(patternString);
      audioEngine.play();

      // Get scheduled callbacks
      const scheduleCalls = mockTransport.schedule.mock.calls;
      const callbacks = scheduleCalls
        .filter(call => call[1] !== undefined)
        .map(call => call[0]);

      // Execute callbacks and verify correct synthesizers are triggered
      callbacks.forEach(callback => {
        callback(0);
      });

      // Should trigger kick synthesizer with correct parameters
      expect(mockKickSynth.triggerAttackRelease).toHaveBeenCalledWith('C1', '8n');
    });
  });

  describe('Pattern Validation for Kick Drum', () => {
    it('should validate kick drum pattern correctly', () => {
      const validPattern = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      const validation = PatternParser.validate(validPattern);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validInstruments).toContain('kick');
    });

    it('should detect invalid kick drum pattern', () => {
      const invalidPattern = 'TEMPO 120\n\nseq kick: xyz...';
      const validation = PatternParser.validate(invalidPattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.invalidInstruments).toContain('kick');
    });

    it('should handle kick drum pattern with different naming', () => {
      const patternString = 'TEMPO 120\n\nseq kickdrum: x...x...x...x...';
      const parsed = PatternParser.parse(patternString);

      expect(parsed.instruments.kickdrum).toBeDefined();
      expect(parsed.instruments.kickdrum.steps).toContain(true);
    });
  });

  describe('Real-time Kick Drum Playback', () => {
    it('should maintain kick drum timing during playback', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      audioEngine.loadPattern(patternString);

      // Start playback
      audioEngine.play();

      // Verify transport is started
      expect(mockTransport.start).toHaveBeenCalled();

      // Verify state shows playing
      const state = audioEngine.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('should stop kick drum playback correctly', async () => {
      await audioEngine.initialize();

      const patternString = 'TEMPO 120\n\nseq kick: x...x...x...x...';
      audioEngine.loadPattern(patternString);

      audioEngine.play();
      audioEngine.stop();

      // Verify transport is stopped and events are cleared
      expect(mockTransport.stop).toHaveBeenCalled();
      expect(mockTransport.clear).toHaveBeenCalled();

      const state = audioEngine.getState();
      expect(state.isPlaying).toBe(false);
    });
  });
});
