import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { mockAudioContext } from './sharedMocks'

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
