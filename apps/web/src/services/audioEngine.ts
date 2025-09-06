// Basic audio engine for ASCII Generative Sequencer
import { ParsedPattern } from '../types/app';
import { PatternParser } from './patternParser';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private currentPattern: ParsedPattern | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private scheduledEvents: number[] = [];
  private startTime: number = 0;
  // private currentStep: number = 0; // TODO: Implement step tracking for visualizations
  private stepInterval: number = 0;

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

      // Calculate step interval based on tempo
      const stepsPerBeat = 4; // 16th notes
      const beatsPerMinute = this.currentPattern.tempo;
      const secondsPerBeat = 60 / beatsPerMinute;
      this.stepInterval = secondsPerBeat / stepsPerBeat;

      // Set playback start time
      this.startTime = this.audioContext.currentTime;
      // this.currentStep = 0; // TODO: Implement step tracking for visualizations

      // Start the scheduler
      this.schedulePattern();

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
    const volume = this.gainNode ? 20 * Math.log10(this.gainNode.gain.value) : -6;

    // Calculate current playback time
    let currentTime = 0;
    if (this.audioContext && this.isPlaying && this.startTime > 0) {
      currentTime = this.audioContext.currentTime - this.startTime;
    }

    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      tempo,
      currentTime,
      volume,
      error: null // Audio engine doesn't track errors in state, they're handled by the hook
    };
  }


  // Synthesizer methods will be implemented later

  /**
   * Schedule pattern playback
   */
  private schedulePattern(): void {
    if (!this.audioContext || !this.currentPattern) return;

    const totalSteps = this.currentPattern.totalSteps;

    // Schedule the entire pattern loop
    for (let step = 0; step < totalSteps; step++) {
      const stepTime = this.startTime + (step * this.stepInterval);

      // Check each instrument for hits at this step
      Object.entries(this.currentPattern.instruments).forEach(([instrumentName, instrumentData]) => {
        if (instrumentData.steps[step] === true) {
          this.scheduleInstrumentHit(instrumentName, stepTime);
        }
      });
    }

    // Schedule the next loop
    const loopTime = this.startTime + (totalSteps * this.stepInterval);
    const timeoutId = window.setTimeout(() => {
      if (this.isPlaying) {
        this.startTime = this.audioContext!.currentTime;
        this.schedulePattern();
      }
    }, (loopTime - this.audioContext.currentTime) * 1000);

    this.scheduledEvents.push(timeoutId);
  }

  /**
   * Schedule an instrument hit
   */
  private scheduleInstrumentHit(instrumentName: string, time: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Connect: oscillator -> envelope -> gain -> destination
    oscillator.connect(envelope);
    envelope.connect(this.gainNode);

    // Set up the sound based on instrument
    switch (instrumentName.toLowerCase()) {
      case 'kick':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, time);
        oscillator.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        envelope.gain.setValueAtTime(0.8, time);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        oscillator.start(time);
        oscillator.stop(time + 0.2);
        break;

      case 'snare':
        // Create noise for snare
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.connect(envelope);

        envelope.gain.setValueAtTime(0.3, time);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        noise.start(time);
        noise.stop(time + 0.1);
        break;

      case 'hihat':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(8000, time);
        envelope.gain.setValueAtTime(0.1, time);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        oscillator.start(time);
        oscillator.stop(time + 0.05);
        break;

      default:
        // Default sound for unknown instruments
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, time);
        envelope.gain.setValueAtTime(0.3, time);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        oscillator.start(time);
        oscillator.stop(time + 0.1);
        break;
    }
  }

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(id => clearTimeout(id));
    this.scheduledEvents = [];
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
