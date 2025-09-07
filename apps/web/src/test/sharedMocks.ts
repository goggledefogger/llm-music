import { vi } from 'vitest';

// Shared mock objects to reduce duplication across test files
// These can be imported and used in individual test files

export const mockTone = {
  default: {
    start: vi.fn().mockResolvedValue(undefined),
    getTransport: vi.fn(() => ({
      bpm: { value: 120 },
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      clear: vi.fn(),
      schedule: vi.fn(),
      unschedule: vi.fn()
    })),
    MembraneSynth: vi.fn(() => ({
      connect: vi.fn(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn()
    })),
    NoiseSynth: vi.fn(() => ({
      connect: vi.fn(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn()
    })),
    MetalSynth: vi.fn(() => ({
      connect: vi.fn(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn()
    })),
    Synth: vi.fn(() => ({
      connect: vi.fn(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn()
    })),
    Reverb: vi.fn(() => ({
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Distortion: vi.fn(() => ({
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Filter: vi.fn(() => ({
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Volume: vi.fn(() => ({
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Master: {
      volume: { value: 0 }
    }
  }
};

export const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  createGain: vi.fn(() => ({
    gain: { 
      value: 0.5,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createBuffer: vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(4410)),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  resume: vi.fn().mockResolvedValue(undefined),
};

export const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
  (mockSetTimeout as any).callbacks = (mockSetTimeout as any).callbacks || [];
  (mockSetTimeout as any).callbacks.push({ callback, delay });
  return Math.random();
});

export const mockClearTimeout = vi.fn();

// Helper function to reset mocks
export const resetMocks = () => {
  vi.clearAllMocks();
  (mockSetTimeout as any).callbacks = [];
  mockAudioContext.currentTime = 0;
};
