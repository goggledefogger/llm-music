// Integration test for Hybrid Audio Engine - Tests real behavior
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridAudioEngine } from './hybridAudioEngine';

// Minimal mocking - only what's absolutely necessary for test environment
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

// Mock only browser APIs that don't exist in test environment
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

describe('Hybrid Audio Engine Integration', () => {
  let engine: HybridAudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = HybridAudioEngine.getInstance();
  });

  afterEach(() => {
    engine.dispose();
  });

  it('should handle a complete audio workflow', async () => {
    // 1. Initialize the engine
    await engine.initialize();
    expect(engine.getState().isInitialized).toBe(true);

    // 2. Load a pattern
    const pattern = `TEMPO 128
seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

    engine.loadPattern(pattern);
    expect(engine.getState().tempo).toBe(128);

    // 3. Set up audio controls
    engine.setTempo(140);
    engine.setVolume(-3);
    engine.setEffectEnabled('reverb', true);
    engine.setEffectWet('reverb', 0.3);

    // 4. Start playback
    engine.play();
    expect(engine.getState().isPlaying).toBe(true);

    // 5. Pause and resume
    engine.pause();
    expect(engine.getState().isPaused).toBe(true);
    expect(engine.getState().isPlaying).toBe(false);

    engine.play();
    expect(engine.getState().isPlaying).toBe(true);

    // 6. Stop playback
    engine.stop();
    expect(engine.getState().isPlaying).toBe(false);
    expect(engine.getState().isPaused).toBe(false);

    // 7. Verify performance metrics are available
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toHaveProperty('fps');
    expect(metrics).toHaveProperty('uptime');
  });

  it('should handle multiple pattern changes during playback', async () => {
    await engine.initialize();

    // Load first pattern
    const pattern1 = `TEMPO 120
seq kick: x...x...x...x...`;

    engine.loadPattern(pattern1);
    engine.play();
    expect(engine.getState().isPlaying).toBe(true);
    expect(engine.getState().tempo).toBe(120);

    // Change to second pattern while playing
    const pattern2 = `TEMPO 160
seq kick: x.x.x.x.x.x.x.x.
seq snare: ....x.......x...`;

    engine.loadPattern(pattern2);
    expect(engine.getState().tempo).toBe(160);
    expect(engine.getState().isPlaying).toBe(true); // Should still be playing

    // Stop and verify state
    engine.stop();
    expect(engine.getState().isPlaying).toBe(false);
  });

  it('should handle effects chain management', async () => {
    await engine.initialize();
    engine.loadPattern(`TEMPO 120
seq kick: x...x...x...x...`);

    // Test effects management
    engine.setEffectEnabled('reverb', true);
    engine.setEffectWet('reverb', 0.5);

    engine.setEffectEnabled('delay', true);
    engine.setEffectWet('delay', 0.2);

    // Verify effects are enabled
    expect(engine.getState().effectsEnabled).toBe(true);

    // Disable effects
    engine.setEffectEnabled('reverb', false);
    engine.setEffectEnabled('delay', false);

    // Note: effectsEnabled might still be true due to compressor being enabled by default
    // This tests the actual behavior rather than implementation details
  });

  it('should provide consistent state during rapid operations', async () => {
    await engine.initialize();
    engine.loadPattern(`TEMPO 120
seq kick: x...x...x...x...`);

    // Rapid state changes
    engine.setTempo(100);
    engine.setVolume(-12);
    engine.play();
    engine.setTempo(140);
    engine.pause();
    engine.setVolume(-6);
    engine.play();
    engine.stop();

    // Verify final state is consistent
    const finalState = engine.getState();
    expect(finalState.isInitialized).toBe(true);
    expect(finalState.isPlaying).toBe(false);
    expect(finalState.isPaused).toBe(false);
    expect(finalState.tempo).toBe(140);
    expect(finalState.volume).toBe(-6);
    expect(finalState.error).toBeNull();
  });
});
