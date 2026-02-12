import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { mockAudioContext } from './sharedMocks'

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
