import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioModule } from './AudioModule';
import { ParsedPattern } from '../types/audio';

// Mock the AudioEngine
const mockAudioEngine = {
  initialize: vi.fn(() => Promise.resolve()),
  dispose: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  setTempo: vi.fn(),
  setVolume: vi.fn(),
  loadPattern: vi.fn(),
  getState: vi.fn(() => ({
    isInitialized: true,
    isPlaying: false,
    tempo: 120,
    currentTime: 0,
    volume: -6,
    hasPattern: false
  }))
};

vi.mock('../services/audioEngine', () => ({
  AudioEngine: vi.fn(() => mockAudioEngine)
}));

// Mock React
vi.mock('react', () => ({
  default: {
    createElement: vi.fn((type, props, children) => ({
      type,
      props,
      children
    }))
  },
  createElement: vi.fn((type, props, children) => ({
    type,
    props,
    children
  }))
}));

describe('AudioModule', () => {
  let audioModule: AudioModule;

  beforeEach(() => {
    audioModule = new AudioModule();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (audioModule) {
      audioModule.destroy();
    }
  });

  describe('Module Initialization', () => {
    it('should create AudioModule instance with correct metadata', () => {
      expect(audioModule).toBeInstanceOf(AudioModule);

      const data = audioModule.getData();
      expect(data.metadata.name).toBe('Audio Engine');
      expect(data.metadata.description).toBe('Real-time audio playback and synthesis');
    });

    it('should have correct capabilities', () => {
      const data = audioModule.getData();
      const capabilities = data.metadata.capabilities;
      expect(capabilities.canVisualize).toBe(true);
      expect(capabilities.canExport).toBe(true);
      expect(capabilities.canAnalyze).toBe(true);
    });

    it('should initialize audio engine on module initialization', async () => {
      await audioModule.initialize();

      expect(mockAudioEngine.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockAudioEngine.initialize.mockRejectedValueOnce(new Error('Audio init failed'));

      await expect(audioModule.initialize()).rejects.toThrow('Failed to initialize audio engine');
    });
  });

  describe('Audio Playback Controls', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should play audio', async () => {
      await audioModule.play();

      expect(mockAudioEngine.play).toHaveBeenCalled();
    });

    it('should pause audio', () => {
      audioModule.pause();

      expect(mockAudioEngine.pause).toHaveBeenCalled();
    });

    it('should stop audio', () => {
      audioModule.stop();

      expect(mockAudioEngine.stop).toHaveBeenCalled();
    });

    it('should handle play errors', async () => {
      mockAudioEngine.play.mockImplementationOnce(() => {
        throw new Error('Play failed');
      });

      await audioModule.play();

      // Should set error state
      const state = audioModule.getState();
      expect(state.error).toContain('Play failed');
    });

    it('should handle pause errors', () => {
      mockAudioEngine.pause.mockImplementationOnce(() => {
        throw new Error('Pause failed');
      });

      audioModule.pause();

      const state = audioModule.getState();
      expect(state.error).toContain('Pause failed');
    });

    it('should handle stop errors', () => {
      mockAudioEngine.stop.mockImplementationOnce(() => {
        throw new Error('Stop failed');
      });

      audioModule.stop();

      const state = audioModule.getState();
      expect(state.error).toContain('Stop failed');
    });
  });

  describe('Tempo and Volume Controls', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should set tempo', () => {
      audioModule.setTempo(140);

      expect(mockAudioEngine.setTempo).toHaveBeenCalledWith(140);
    });

    it('should set volume', () => {
      audioModule.setVolume(-12);

      expect(mockAudioEngine.setVolume).toHaveBeenCalledWith(-12);
    });

    it('should update data when tempo changes', () => {
      audioModule.setTempo(140);

      const data = audioModule.getData();
      expect(data.data.tempo).toBe(140);
    });

    it('should update data when volume changes', () => {
      audioModule.setVolume(-12);

      const data = audioModule.getData();
      expect(data.data.volume).toBe(-12);
    });
  });

  describe('Pattern Loading', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should load a kick drum pattern', () => {
      const pattern: ParsedPattern = {
        tempo: 120,
        instruments: {
          kick: {
            name: 'kick',
            steps: [true, false, false, false, true, false, false, false]
          }
        },
        totalSteps: 8
      };

      audioModule.loadPattern(pattern);

      expect(mockAudioEngine.loadPattern).toHaveBeenCalled();
    });

    it('should handle pattern loading errors', () => {
      mockAudioEngine.loadPattern.mockImplementationOnce(() => {
        throw new Error('Pattern load failed');
      });

      const pattern: ParsedPattern = {
        tempo: 120,
        instruments: {
          kick: {
            name: 'kick',
            steps: [true, false, false, false]
          }
        },
        totalSteps: 4
      };

      audioModule.loadPattern(pattern);

      const state = audioModule.getState();
      expect(state.error).toContain('Failed to load pattern into audio engine');
    });

    it('should clear errors when pattern loads successfully', () => {
      // First set an error
      audioModule.setError('Previous error');

      const pattern: ParsedPattern = {
        tempo: 120,
        instruments: {
          kick: {
            name: 'kick',
            steps: [true, false, false, false]
          }
        },
        totalSteps: 4
      };

      audioModule.loadPattern(pattern);

      const state = audioModule.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should return initial data', () => {
      const data = audioModule.getData();

      expect(data.data).toHaveProperty('isPlaying');
      expect(data.data).toHaveProperty('tempo');
      expect(data.data).toHaveProperty('volume');
      expect(data.data).toHaveProperty('currentTime');
      expect(data.data).toHaveProperty('pattern');
      expect(data.data).toHaveProperty('waveform');
    });

    it('should update state from audio engine', () => {
      mockAudioEngine.getState.mockReturnValue({
        isInitialized: true,
        isPlaying: true,
        tempo: 140,
        currentTime: 2.5,
        volume: -12,
        hasPattern: true
      });

      // Trigger state update by calling a method that updates state
      audioModule.setTempo(140);

      const data = audioModule.getData();
      expect(data.data.tempo).toBe(140);
    });

    it('should handle state update errors gracefully', () => {
      mockAudioEngine.getState.mockImplementationOnce(() => {
        throw new Error('State update failed');
      });

      // Should not throw error
      expect(() => audioModule.setTempo(140)).not.toThrow();
    });
  });

  describe('Visualization', () => {
    it('should render visualization placeholder', () => {
      const visualization = audioModule.renderVisualization();

      expect(visualization).toBeDefined();
      expect(visualization.type).toBe('div');
      expect(visualization.props.className).toBe('audio-visualization');
    });

    it('should handle visualization updates', () => {
      const updateData = { seek: 1.5 };

      expect(() => audioModule.onVisualizationUpdate(updateData)).not.toThrow();
    });

    it('should handle loop visualization updates', () => {
      const updateData = { loop: { start: 0, end: 4 } };

      expect(() => audioModule.onVisualizationUpdate(updateData)).not.toThrow();
    });
  });

  describe('Audio Engine Integration', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should provide access to audio engine', () => {
      const engine = audioModule.getAudioEngine();

      expect(engine).toBe(mockAudioEngine);
    });

    it('should dispose audio engine on module destruction', () => {
      audioModule.destroy();

      expect(mockAudioEngine.dispose).toHaveBeenCalled();
    });
  });

  describe('Pattern String Conversion', () => {
    beforeEach(async () => {
      await audioModule.initialize();
    });

    it('should convert pattern to string correctly', () => {
      const pattern: ParsedPattern = {
        tempo: 120,
        instruments: {
          kick: {
            name: 'kick',
            steps: [true, false, false, false, true, false, false, false]
          },
          snare: {
            name: 'snare',
            steps: [false, false, true, false, false, false, true, false]
          }
        },
        totalSteps: 8
      };

      audioModule.loadPattern(pattern);

      // The pattern should be converted to string format for the audio engine
      expect(mockAudioEngine.loadPattern).toHaveBeenCalledWith(
        expect.stringContaining('TEMPO 120')
      );
      expect(mockAudioEngine.loadPattern).toHaveBeenCalledWith(
        expect.stringContaining('seq kick: x...x...')
      );
      expect(mockAudioEngine.loadPattern).toHaveBeenCalledWith(
        expect.stringContaining('seq snare: ..x...x.')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockAudioEngine.initialize.mockRejectedValueOnce(new Error('Init failed'));

      await expect(audioModule.initialize()).rejects.toThrow();
    });

    it('should handle audio engine errors during state updates', () => {
      mockAudioEngine.getState.mockImplementation(() => {
        throw new Error('State error');
      });

      // Should not crash the module
      expect(() => audioModule.setTempo(140)).not.toThrow();
    });
  });
});
