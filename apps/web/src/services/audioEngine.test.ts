import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from './audioEngine';
import { mockAudioContext, mockSetTimeout, mockClearTimeout, resetMocks } from '../test/sharedMocks';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let originalAudioContext: any;
  let originalSetTimeout: any;
  let originalClearTimeout: any;

  beforeEach(() => {
    // Reset mocks using shared utility
    resetMocks();
    
    // Mock global objects
    originalAudioContext = (global as any).AudioContext;
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    
    (global as any).AudioContext = vi.fn(() => mockAudioContext);
    (global as any).webkitAudioContext = vi.fn(() => mockAudioContext);
    global.setTimeout = mockSetTimeout;
    global.clearTimeout = mockClearTimeout;
    
    // Get fresh instance
    audioEngine = AudioEngine.getInstance();
    
    // Initialize the audio engine
    audioEngine.initialize();
  });

  afterEach(() => {
    // Restore original implementations
    (global as any).AudioContext = originalAudioContext;
    (global as any).webkitAudioContext = undefined;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Sequencer Continuous Playback', () => {
    it('should start and stop playback without errors', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback - should not throw
      expect(() => audioEngine.play()).not.toThrow();
      
      // Verify state is playing
      const playingState = audioEngine.getState();
      expect(playingState.isPlaying).toBe(true);
      
      // Stop playback - should not throw
      expect(() => audioEngine.stop()).not.toThrow();
      
      // Verify state is stopped
      const stoppedState = audioEngine.getState();
      expect(stoppedState.isPlaying).toBe(false);
    });

    it('should handle tempo changes without breaking playback', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Change tempo - should not throw
      expect(() => audioEngine.setTempo(140)).not.toThrow();
      
      // Verify state is still playing
      const state = audioEngine.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.tempo).toBe(140);
    });

    it('should handle volume changes without breaking playback', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Change volume - should not throw
      expect(() => audioEngine.setVolume(-12)).not.toThrow();
      
      // Verify state is still playing
      const state = audioEngine.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('should pause and resume playback', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Pause - should not throw
      expect(() => audioEngine.pause()).not.toThrow();
      
      // Verify state is paused
      const pausedState = audioEngine.getState();
      expect(pausedState.isPlaying).toBe(false);
      
      // Resume by playing again
      expect(() => audioEngine.play()).not.toThrow();
      
      // Verify state is playing again
      const playingState = audioEngine.getState();
      expect(playingState.isPlaying).toBe(true);
    });
  });

  describe('Pattern Loading and Validation', () => {
    it('should load valid patterns correctly', async () => {
      await audioEngine.initialize();
      
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      
      expect(() => {
        audioEngine.loadPattern(testPattern);
      }).not.toThrow();
    });

    it('should handle invalid patterns gracefully', async () => {
      await audioEngine.initialize();
      
      // Use a pattern that has no valid sequences - should not throw
      const invalidPattern = 'This is not a valid pattern at all';
      
      // The pattern parser is designed to be forgiving and not throw errors
      expect(() => {
        audioEngine.loadPattern(invalidPattern);
      }).not.toThrow();
      
      // The pattern should be loaded but with no instruments
      const state = audioEngine.getState();
      expect(state.tempo).toBe(120); // Default tempo
    });
  });

  describe('Audio Engine State Management', () => {
    it('should return correct state when initialized', () => {
      // Stop any playing audio first to ensure clean state
      audioEngine.stop();
      
      // The engine is initialized in beforeEach, so we test the initialized state
      const state = audioEngine.getState();
      
      // The engine should be initialized from beforeEach
      expect(state.isInitialized).toBe(true);
      expect(state.isPlaying).toBe(false); // Not playing after stop
      expect(state.tempo).toBe(120);
      expect(state.currentTime).toBe(0);
    });

    it('should return correct state when initialized and playing', async () => {
      await audioEngine.initialize();
      
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      audioEngine.play();
      
      const state = audioEngine.getState();
      
      expect(state.isInitialized).toBe(true);
      expect(state.isPlaying).toBe(true);
      expect(state.tempo).toBe(120);
    });
  });
});
