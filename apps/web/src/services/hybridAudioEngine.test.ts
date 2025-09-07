// Tests for Hybrid Audio Engine - Minimal mocking approach
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridAudioEngine } from './hybridAudioEngine';

// Only mock what we absolutely need to avoid browser dependencies
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Transport: {
    bpm: { value: 120 },
    timeSignature: 4,
    start: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn()
  },
  Volume: vi.fn().mockImplementation(() => ({
    volume: { value: -6 },
    connect: vi.fn().mockReturnThis(),
    dispose: vi.fn()
  })),
  Reverb: vi.fn().mockImplementation(() => ({
    wet: { value: 0.1 },
    connect: vi.fn().mockReturnThis(),
    dispose: vi.fn()
  })),
  PingPongDelay: vi.fn().mockImplementation(() => ({
    wet: { value: 0.1 },
    connect: vi.fn().mockReturnThis(),
    dispose: vi.fn()
  })),
  Compressor: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockReturnThis(),
    dispose: vi.fn()
  })),
  Destination: { connect: vi.fn() }
}));

// Mock only the browser APIs that don't exist in test environment
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(() => ({
    currentTime: 0,
    state: 'running',
    sampleRate: 44100,
    createGain: vi.fn(() => ({
      gain: { value: 1.0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      disconnect: vi.fn()
    })),
    createBuffer: vi.fn(() => ({
      getChannelData: vi.fn(() => new Float32Array(4410))
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      disconnect: vi.fn()
    })),
    resume: vi.fn().mockResolvedValue(undefined)
  }))
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: window.AudioContext
});

describe('HybridAudioEngine', () => {
  let engine: HybridAudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = HybridAudioEngine.getInstance();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('Basic Functionality', () => {
    it('should be a singleton', () => {
      const instance1 = HybridAudioEngine.getInstance();
      const instance2 = HybridAudioEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize and be ready for use', async () => {
      await engine.initialize();

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle multiple initialization calls gracefully', async () => {
      await engine.initialize();
      await expect(engine.initialize()).resolves.not.toThrow();
    });
  });

  describe('Pattern Management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should load valid patterns without errors', () => {
      const validPattern = `TEMPO 120
seq kick: x...x...x...x...
seq snare: ....x.......x...`;

      expect(() => engine.loadPattern(validPattern)).not.toThrow();
    });

    it('should reject invalid patterns with clear error messages', () => {
      const invalidPattern = 'INVALID PATTERN';

      expect(() => engine.loadPattern(invalidPattern)).toThrow(/Failed to load pattern/);
    });

    it('should update tempo when loading patterns with tempo', () => {
      const pattern = `TEMPO 140
seq kick: x...x...x...x...`;

      engine.loadPattern(pattern);

      const state = engine.getState();
      expect(state.tempo).toBe(140);
    });
  });

  describe('Playback Control', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.loadPattern(`TEMPO 120
seq kick: x...x...x...x...`);
    });

    it('should start, pause, and stop playback correctly', () => {
      // Start playback
      engine.play();
      expect(engine.getState().isPlaying).toBe(true);

      // Pause playback
      engine.pause();
      expect(engine.getState().isPaused).toBe(true);
      expect(engine.getState().isPlaying).toBe(false);

      // Stop playback
      engine.stop();
      expect(engine.getState().isPlaying).toBe(false);
      expect(engine.getState().isPaused).toBe(false);
    });

    it('should prevent playback without proper setup', () => {
      const uninitializedEngine = new (HybridAudioEngine as any)();
      expect(() => uninitializedEngine.play()).toThrow(/not initialized/);
    });
  });

  describe('Audio Controls', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should control tempo within valid range', () => {
      engine.setTempo(140);
      expect(engine.getState().tempo).toBe(140);

      // Test clamping
      engine.setTempo(300); // Too high
      expect(engine.getState().tempo).toBe(200);

      engine.setTempo(30); // Too low
      expect(engine.getState().tempo).toBe(60);
    });

    it('should control volume', () => {
      engine.setVolume(-12);
      expect(engine.getState().volume).toBe(-12);
    });

    it('should manage effects without errors', () => {
      expect(() => engine.setEffectEnabled('reverb', true)).not.toThrow();
      expect(() => engine.setEffectWet('reverb', 0.5)).not.toThrow();
    });
  });

  describe('State and Performance', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should provide accurate state information', () => {
      const state = engine.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.error).toBeNull();
      expect(state.effectsEnabled).toBe(true); // Compressor enabled by default
      expect(state.collaborationEnabled).toBe(false);
      expect(state.audioQuality).toBe('high');
    });

    it('should track performance metrics', () => {
      const metrics = engine.getPerformanceMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('uptime');
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
    });

    it('should clean up resources properly', () => {
      engine.loadPattern(`TEMPO 120
seq kick: x...x...x...x...`);
      engine.play();

      expect(() => engine.dispose()).not.toThrow();
      expect(engine.getState().isInitialized).toBe(false);
    });
  });

  describe('Pattern Loop Fix', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should correctly loop patterns shorter than totalSteps', () => {
      // Test with a pattern that has 8 steps but totalSteps = 16
      const shortPattern = `TEMPO 120
seq kick: x...x...
seq snare: ..x...x.`;

      expect(() => engine.loadPattern(shortPattern)).not.toThrow();

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle patterns with different instrument lengths', () => {
      // Test with a pattern where instruments have different lengths
      const mixedPattern = `TEMPO 120
seq kick: x...x...x...x...
seq snare: ..x...x.`;

      expect(() => engine.loadPattern(mixedPattern)).not.toThrow();

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle very short patterns correctly', () => {
      // Test with a very short pattern (4 steps)
      const shortPattern = `TEMPO 120
seq kick: x...
seq snare: .x..`;

      expect(() => engine.loadPattern(shortPattern)).not.toThrow();

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle single step patterns', () => {
      // Test with a single step pattern
      const singleStepPattern = `TEMPO 120
seq kick: x
seq snare: .`;

      expect(() => engine.loadPattern(singleStepPattern)).not.toThrow();

      const state = engine.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBeNull();
    });
  });
});
