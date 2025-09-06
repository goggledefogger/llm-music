// Basic audio engine for ASCII Generative Sequencer
import { ParsedPattern } from '../types/audio';
import { PatternParser } from './patternParser';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private currentPattern: ParsedPattern | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  // private scheduledEvents: number[] = []; // Will be used when scheduling is implemented

  private constructor() {
    // Constructor is now minimal - initialization happens in initialize()
  }

  /**
   * Get the singleton instance of AudioEngine
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize the audio engine
   * Must be called after a user gesture
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.5; // Start at -6dB equivalent
      this.gainNode.connect(this.audioContext.destination);

      // Resume context if suspended (required for user gesture)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('Audio engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw new Error('Failed to initialize audio engine');
    }
  }

  /**
   * Load and parse a pattern
   */
  loadPattern(patternString: string): void {
    try {
      this.currentPattern = PatternParser.parse(patternString);
      console.log('Pattern loaded:', this.currentPattern);
    } catch (error) {
      console.error('Failed to load pattern:', error);
      throw new Error('Failed to load pattern');
    }
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    if (!this.currentPattern) {
      throw new Error('No pattern loaded');
    }

    if (this.isPlaying) {
      return;
    }

    try {
      // Clear any existing scheduled events
      this.clearScheduledEvents();

      // Set playback start time

      // Start the scheduler
      // Audio context is ready

      this.isPlaying = true;
      console.log('Playback started');
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw new Error('Failed to start playback');
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying) {
      return;
    }

    // Stop playback
    this.isPlaying = false;
    console.log('Playback paused');
  }

  /**
   * Stop playback
   */
  stop(): void {
    // Stop playback
    this.clearScheduledEvents();
    this.isPlaying = false;
    // Reset playback state
    console.log('Playback stopped');
  }

  /**
   * Set tempo
   */
  setTempo(tempo: number): void {
    const clampedTempo = Math.max(60, Math.min(200, tempo));

    if (this.currentPattern) {
      this.currentPattern.tempo = clampedTempo;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (!this.gainNode) return;

    // Convert dB to linear gain (volume is in dB, -60 to 0)
    const clampedVolume = Math.max(-60, Math.min(0, volume));
    const linearGain = Math.pow(10, clampedVolume / 20);
    this.gainNode.gain.value = linearGain;
  }

  /**
   * Get current state
   */
  getState() {
    const tempo = this.currentPattern?.tempo || 120;
    const currentTime = this.audioContext ? this.audioContext.currentTime : 0;
    const volume = this.gainNode ? 20 * Math.log10(this.gainNode.gain.value) : -6;

    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      tempo,
      currentTime,
      volume,
      hasPattern: !!this.currentPattern
    };
  }


  // Synthesizer methods will be implemented later

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    // Clear scheduled events - will be implemented when scheduling is added
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    // Cleanup will be implemented when synthesizers are added
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();
