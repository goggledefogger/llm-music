import { vi } from 'vitest';

// Shared mock objects to reduce duplication across test files
// These can be imported and used in individual test files

// --- Web Audio API mock (must be defined first — Tone mock references it) ---

export const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  destination: {},
  createGain: vi.fn(() => ({
    gain: {
      value: 0.5,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
  })),
  createBiquadFilter: vi.fn(() => ({
    type: 'peaking' as BiquadFilterType,
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    gain: { setValueAtTime: vi.fn(), value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createDynamicsCompressor: vi.fn(() => ({
    threshold: { setValueAtTime: vi.fn(), value: -24 },
    ratio: { setValueAtTime: vi.fn(), value: 4 },
    attack: { setValueAtTime: vi.fn(), value: 0.01 },
    release: { setValueAtTime: vi.fn(), value: 0.25 },
    knee: { setValueAtTime: vi.fn(), value: 30 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createDelay: vi.fn(() => ({
    delayTime: { setValueAtTime: vi.fn(), value: 0.25 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createWaveShaper: vi.fn(() => ({
    curve: null,
    oversample: '4x',
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createConvolver: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createStereoPanner: vi.fn(() => ({
    pan: { setValueAtTime: vi.fn(), value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createBuffer: vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(4410)),
    duration: 0.1,
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
  })),
  resume: vi.fn().mockResolvedValue(undefined),
};

// --- Tone.js mock ---
//
// The audio engine uses Tone.js for:
// - Tone.start() — resume AudioContext
// - Tone.context — shared context wrapper (rawContext, create* methods)
// - Tone.Transport — scheduling (bpm, start, stop, pause, position)
// - Tone.Part — event scheduling (constructor, loop, loopEnd, start, dispose)
//
// All sound generation uses raw Web Audio API nodes created via Tone.context.

export function createMockToneContext() {
  return {
    rawContext: mockAudioContext,
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    createGain: vi.fn(() => mockAudioContext.createGain()),
    createOscillator: vi.fn(() => mockAudioContext.createOscillator()),
    createBiquadFilter: vi.fn(() => mockAudioContext.createBiquadFilter()),
    createDynamicsCompressor: vi.fn(() => mockAudioContext.createDynamicsCompressor()),
    createBuffer: vi.fn(() => mockAudioContext.createBuffer()),
    createBufferSource: vi.fn(() => mockAudioContext.createBufferSource()),
    createDelay: vi.fn(() => mockAudioContext.createDelay()),
    createWaveShaper: vi.fn(() => mockAudioContext.createWaveShaper()),
    createConvolver: vi.fn(() => mockAudioContext.createConvolver()),
    createStereoPanner: vi.fn(() => mockAudioContext.createStereoPanner()),
  };
}

export const mockToneTransport = {
  bpm: { value: 120 },
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  position: 0,
  seconds: 0,
};

export const mockTonePart = {
  loop: false,
  loopEnd: 0,
  start: vi.fn(),
  stop: vi.fn(),
  dispose: vi.fn(),
};

export const mockTone = {
  start: vi.fn().mockResolvedValue(undefined),
  context: createMockToneContext(),
  Transport: mockToneTransport,
  Part: vi.fn(() => ({ ...mockTonePart })),
  getDestination: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
};

// --- Timer mocks ---

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
