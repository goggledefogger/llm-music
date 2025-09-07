import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from './audioEngine';

// Mock Web Audio API
const mockAudioContext = {
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

// Mock window.setTimeout
const mockSetTimeout = vi.fn((callback: () => void, delay: number) => {
  // Store the callback to be manually triggered in tests
  mockSetTimeout.callbacks = mockSetTimeout.callbacks || [];
  mockSetTimeout.callbacks.push(callback);
  return 1; // Mock timeout ID
});

// Mock window.clearTimeout
const mockClearTimeout = vi.fn();

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let originalAudioContext: any;
  let originalSetTimeout: any;
  let originalClearTimeout: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    originalAudioContext = (global as any).AudioContext;
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    
    (global as any).AudioContext = vi.fn(() => mockAudioContext);
    (global as any).webkitAudioContext = vi.fn(() => mockAudioContext);
    global.setTimeout = mockSetTimeout;
    global.clearTimeout = mockClearTimeout;

    // Reset timeout callbacks
    mockSetTimeout.callbacks = [];
    
    // Get fresh instance
    audioEngine = AudioEngine.getInstance();
    
    // Initialize the audio engine
    audioEngine.initialize();
    
    // Reset audio context time
    mockAudioContext.currentTime = 0;
  });

  afterEach(() => {
    // Restore original implementations
    (global as any).AudioContext = originalAudioContext;
    (global as any).webkitAudioContext = undefined;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Sequencer Continuous Playback', () => {
    it('should schedule multiple loops ahead for continuous playback', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Verify that setTimeout was called for scheduling the next batch
      expect(mockSetTimeout).toHaveBeenCalled();
      
      // Get the timeout callback and delay
      const setTimeoutCall = mockSetTimeout.mock.calls[0];
      const timeoutCallback = setTimeoutCall[0];
      const timeoutDelay = setTimeoutCall[1];
      
      // Verify the delay is reasonable (should be around 8 seconds for 4 loops of 2 seconds each)
      expect(timeoutDelay).toBeGreaterThan(7000); // At least 7 seconds
      expect(timeoutDelay).toBeLessThan(9000); // At most 9 seconds
      
      // Simulate the timeout callback being triggered
      mockAudioContext.currentTime = 12.464; // Simulate time passing
      timeoutCallback();
      
      // Verify that setTimeout was called again for the next batch
      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    });

    it('should maintain consistent timing across multiple loop cycles', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Get the first timeout callback
      const firstTimeoutCallback = mockSetTimeout.mock.calls[0][0];
      const firstTimeoutDelay = mockSetTimeout.mock.calls[0][1];
      
      // Simulate first callback
      mockAudioContext.currentTime = 12.464;
      firstTimeoutCallback();
      
      // Get the second timeout callback
      const secondTimeoutCallback = mockSetTimeout.mock.calls[1][0];
      const secondTimeoutDelay = mockSetTimeout.mock.calls[1][1];
      
      // Verify that the delays are consistent (should be the same)
      expect(secondTimeoutDelay).toBeCloseTo(firstTimeoutDelay, 0);
      
      // Simulate second callback
      mockAudioContext.currentTime = 20.464;
      secondTimeoutCallback();
      
      // Verify that setTimeout was called a third time
      expect(mockSetTimeout).toHaveBeenCalledTimes(3);
    });

    it('should schedule all instrument hits correctly for each loop', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern with known hits
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Verify that oscillators were created for each hit
      // Kick hits at steps 0, 4, 8, 12 (4 hits per loop)
      // Snare hits at steps 4, 12 (2 hits per loop)  
      // Hihat hits at steps 0, 2, 4, 6, 8, 10, 12, 14 (8 hits per loop)
      // Total: 14 hits per loop × 4 loops = 56 hits
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled(); // For snare noise
      
      // Verify that the oscillators were started
      const oscillatorCalls = mockAudioContext.createOscillator.mock.results;
      oscillatorCalls.forEach((result: any) => {
        expect(result.value.start).toHaveBeenCalled();
        expect(result.value.stop).toHaveBeenCalled();
      });
    });

    it('should handle tempo changes without breaking continuous playback', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Change tempo
      audioEngine.setTempo(140);
      
      // Verify that playback continues (no errors thrown)
      expect(() => {
        const state = audioEngine.getState();
        expect(state.isPlaying).toBe(true);
      }).not.toThrow();
    });

    it('should stop all scheduled events when stopped', async () => {
      // Initialize audio engine
      await audioEngine.initialize();
      
      // Load a test pattern
      const testPattern = 'TEMPO 120\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      audioEngine.loadPattern(testPattern);
      
      // Start playback
      audioEngine.play();
      
      // Verify setTimeout was called
      expect(mockSetTimeout).toHaveBeenCalled();
      
      // Stop playback
      audioEngine.stop();
      
      // Verify clearTimeout was called
      expect(mockClearTimeout).toHaveBeenCalled();
      
      // Verify state is updated
      const state = audioEngine.getState();
      expect(state.isPlaying).toBe(false);
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

    it('should throw error for invalid patterns', async () => {
      await audioEngine.initialize();
      
      // Use a pattern that will cause parsing to fail - missing TEMPO
      const invalidPattern = 'seq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.';
      
      expect(() => {
        audioEngine.loadPattern(invalidPattern);
      }).toThrow('Failed to load pattern');
    });
  });

  describe('Audio Engine State Management', () => {
    it('should return correct state when not initialized', () => {
      // Create a new instance without initializing
      const uninitializedEngine = new AudioEngine();
      const state = uninitializedEngine.getState();
      
      expect(state.isInitialized).toBe(false);
      expect(state.isPlaying).toBe(false);
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
