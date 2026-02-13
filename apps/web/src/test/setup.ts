import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { mockAudioContext } from './sharedMocks'

// Mock Tone.js globally — its ESM build can't resolve in jsdom/vitest.
// This prevents "Cannot find module 'tone/build/esm/core/Global'" errors.
// Individual test files can override with their own vi.mock('tone', ...).
vi.mock('tone', () => {
  const mockGain = () => ({
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })
  const mockFilter = () => ({
    type: 'lowpass',
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    gain: { setValueAtTime: vi.fn(), value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })
  const mockCtx = {
    currentTime: 0,
    state: 'running',
    sampleRate: 44100,
    destination: {},
    createGain: vi.fn(mockGain),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), addEventListener: vi.fn(),
    })),
    createBiquadFilter: vi.fn(mockFilter),
    createDynamicsCompressor: vi.fn(() => ({
      threshold: { setValueAtTime: vi.fn(), value: -24 },
      ratio: { setValueAtTime: vi.fn(), value: 4 },
      attack: { setValueAtTime: vi.fn(), value: 0.01 },
      release: { setValueAtTime: vi.fn(), value: 0.25 },
      knee: { setValueAtTime: vi.fn(), value: 30 },
      connect: vi.fn(), disconnect: vi.fn(),
    })),
    createDelay: vi.fn(() => ({ delayTime: { setValueAtTime: vi.fn(), value: 0.25 }, connect: vi.fn(), disconnect: vi.fn() })),
    createWaveShaper: vi.fn(() => ({ curve: null, oversample: '4x', connect: vi.fn(), disconnect: vi.fn() })),
    createConvolver: vi.fn(() => ({ buffer: null, connect: vi.fn(), disconnect: vi.fn() })),
    createStereoPanner: vi.fn(() => ({ pan: { setValueAtTime: vi.fn(), value: 0 }, connect: vi.fn(), disconnect: vi.fn() })),
    createBuffer: vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(4410)), duration: 0.1 })),
    createBufferSource: vi.fn(() => ({ buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), addEventListener: vi.fn() })),
    resume: vi.fn(),
  }
  return {
    start: vi.fn().mockResolvedValue(undefined),
    context: { ...mockCtx, rawContext: mockCtx },
    Transport: { bpm: { value: 120 }, start: vi.fn(), stop: vi.fn(), pause: vi.fn(), position: 0, seconds: 0 },
    Part: vi.fn(() => ({ loop: false, loopEnd: 0, start: vi.fn(), stop: vi.fn(), dispose: vi.fn() })),
    getDestination: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
  }
})

// Mock Supabase globally so auth code doesn't break tests
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'test-token',
          },
        },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null, data: { user: {}, session: {} } }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Stub scrollIntoView for jsdom (not implemented)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Provide a basic AudioContext mock for tests that initialize audio
// This prevents crashes when the engine constructs Web Audio nodes.
if (!(window as any).AudioContext) {
  (window as any).AudioContext = vi.fn(() => mockAudioContext as any)
}
if (!(window as any).webkitAudioContext) {
  (window as any).webkitAudioContext = (window as any).AudioContext
}
