// Unified Audio Engine - Real-time everything, no pre-calculation
import { ParsedPattern, UnifiedAudioState } from '../types/app';
import { PatternParser } from './patternParser';

export interface ParameterUpdate {
  type: ParameterType;
  value: any;
  timestamp: number;
}

type ParameterType = 'tempo' | 'sequence' | 'effects' | 'eq' | 'volume';

/**
 * Unified Audio Engine - Real-time everything, no pre-calculation
 *
 * Key Principles:
 * 1. Real-time parameter updates - No waiting for next loop
 * 2. Unified parameter interface - Single way to update any parameter
 * 3. No pre-calculation - Everything computed on-demand
 * 4. Clean separation of concerns
 */
export class UnifiedAudioEngine {
  private static instance: UnifiedAudioEngine | null = null;

  // Core state
  private isInitialized = false;
  private isPlaying = false;
  private isPaused = false;
  private currentPattern: ParsedPattern | null = null;

  // Audio context and nodes
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volumeGain: GainNode | null = null;

  // Real-time timing system (no pre-calculation)
  private startTime: number = 0;
  private pausePosition: number = 0;

  // Audio sources and scheduling
  private activeOscillators: OscillatorNode[] = [];
  private activeNoiseSources: AudioBufferSourceNode[] = [];
  private scheduledEvents: number[] = [];

  // Real-time parameter system
  private parameterHistory: ParameterUpdate[] = [];
  private maxParameterHistory = 100;

  private constructor() {
    // Constructor is minimal - initialization happens in initialize()
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): UnifiedAudioEngine {
    if (!UnifiedAudioEngine.instance) {
      UnifiedAudioEngine.instance = new UnifiedAudioEngine();
    }
    return UnifiedAudioEngine.instance;
  }

  /**
   * Initialize the unified audio engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Unified Audio Engine...');

      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create audio graph
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;

      this.volumeGain = this.audioContext.createGain();
      this.volumeGain.gain.value = 0.5; // Start at -6dB equivalent

      // Connect: masterGain -> volumeGain -> destination
      this.masterGain.connect(this.volumeGain);
      this.volumeGain.connect(this.audioContext.destination);

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('Unified Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize unified audio engine:', error);
      throw new Error('Failed to initialize unified audio engine');
    }
  }

  /**
   * Load and parse a pattern with real-time updates
   */
  loadPattern(patternString: string): void {
    try {
      const newPattern = PatternParser.parse(patternString);
      // const wasPlaying = this.isPlaying; // Not needed for unified engine
      const previousPattern = this.currentPattern;

      this.currentPattern = newPattern;

      // Apply real-time updates
      this.updateParameter('sequence', newPattern);

      // Apply tempo changes in real-time
      if (newPattern.tempo && (!previousPattern || previousPattern.tempo !== newPattern.tempo)) {
        this.updateParameter('tempo', newPattern.tempo);
      }

      // Apply EQ changes in real-time
      if (newPattern.eqModules && Object.keys(newPattern.eqModules).length > 0) {
        this.updateParameter('eq', newPattern.eqModules);
      }

      console.log('Pattern loaded with real-time updates:', this.currentPattern);
    } catch (error) {
      console.error('Failed to load pattern:', error);
      throw new Error('Failed to load pattern');
    }
  }

  /**
   * Play the pattern
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
      console.log('Starting unified playback...');

      // Clear any existing scheduled events and audio sources
      this.clearScheduledEvents();
      this.stopAllAudio();

      // Calculate start time based on pause position
      if (this.isPaused) {
        this.startTime = this.audioContext.currentTime - this.pausePosition;
        this.isPaused = false;
        console.log(`Resuming from position: ${this.pausePosition.toFixed(3)}s`);
      } else {
        this.startTime = this.audioContext.currentTime;
        this.pausePosition = 0;
        console.log('Starting from beginning');
      }

      // Restore master gain
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      }

      // Start scheduling
      this.schedulePattern();

      this.isPlaying = true;
      console.log('Unified playback started');
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw new Error('Failed to start playback');
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying) return;

    // Calculate current position
    if (this.audioContext && this.startTime > 0) {
      this.pausePosition = this.audioContext.currentTime - this.startTime;
      // Keep position within loop bounds
      const loopDuration = this.getLoopDuration();
      if (loopDuration > 0) {
        this.pausePosition = this.pausePosition % loopDuration;
      }
    }

    // Stop all audio immediately
    this.stopAllAudio();

    // Clear scheduling
    this.clearScheduledEvents();

    this.isPlaying = false;
    this.isPaused = true;

    console.log(`Paused at position: ${this.pausePosition.toFixed(3)}s`);
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    // Stop all audio immediately
    this.stopAllAudio();

    // Clear scheduling
    this.clearScheduledEvents();

    // Reset position
    this.pausePosition = 0;
    this.startTime = 0;

    // Restore master gain
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    this.isPlaying = false;
    this.isPaused = false;

    console.log('Stopped and reset to beginning');
  }

  /**
   * UNIFIED PARAMETER UPDATE INTERFACE
   * This is the single way to update ANY parameter in real-time
   */
  updateParameter(type: ParameterType, value: any): void {
    const update: ParameterUpdate = {
      type,
      value,
      timestamp: this.audioContext?.currentTime || 0
    };

    // Store parameter update in history
    this.parameterHistory.push(update);
    if (this.parameterHistory.length > this.maxParameterHistory) {
      this.parameterHistory.shift();
    }

    console.log(`[Unified] Updating ${type}:`, value);

    // Apply the parameter update
    switch (type) {
      case 'tempo':
        this.applyTempoUpdate(value);
        break;
      case 'sequence':
        this.applySequenceUpdate(value);
        break;
      case 'effects':
        this.applyEffectsUpdate(value);
        break;
      case 'eq':
        this.applyEQUpdate(value);
        break;
      case 'volume':
        this.applyVolumeUpdate(value);
        break;
      default:
        console.warn(`[Unified] Unknown parameter type: ${type}`);
    }
  }

  /**
   * Apply tempo update in real-time
   */
  private applyTempoUpdate(newTempo: number): void {
    if (!this.currentPattern) return;

    const oldTempo = this.currentPattern.tempo;
    this.currentPattern.tempo = newTempo;

    console.log(`[Unified] Tempo change: ${oldTempo} -> ${newTempo} BPM`);

    // Apply real-time tempo change if currently playing
    if (this.isPlaying && this.audioContext) {
      this.applyRealTimeTempoChange(oldTempo, newTempo);
    }
  }

  /**
   * Apply sequence update in real-time
   */
  private applySequenceUpdate(newPattern: ParsedPattern): void {
    const oldPattern = this.currentPattern;
    this.currentPattern = newPattern;

    console.log(`[Unified] Sequence updated - ${Object.keys(newPattern.instruments).length} instruments`);

    // Apply real-time sequence change if currently playing
    if (this.isPlaying && this.audioContext) {
      this.applyRealTimeSequenceChange(oldPattern, newPattern);
    }
  }

  /**
   * Apply effects update in real-time
   */
  private applyEffectsUpdate(effectsConfig: any): void {
    console.log(`[Unified] Effects updated:`, effectsConfig);
    // TODO: Implement effects system
  }

  /**
   * Apply EQ update in real-time
   */
  private applyEQUpdate(eqConfig: any): void {
    console.log(`[Unified] EQ updated:`, eqConfig);
    // TODO: Implement EQ system
  }

  /**
   * Apply volume update in real-time
   */
  private applyVolumeUpdate(volume: number): void {
    if (!this.volumeGain) return;

    // Convert dB to linear gain (volume is in dB, -60 to 0)
    const clampedVolume = Math.max(-60, Math.min(0, volume));
    const linearGain = Math.pow(10, clampedVolume / 20);

    if (this.audioContext) {
      this.volumeGain.gain.setValueAtTime(linearGain, this.audioContext.currentTime);
    }

    console.log(`[Unified] Volume updated to ${volume} dB (${linearGain.toFixed(3)} linear)`);
  }

  /**
   * Apply real-time tempo change without waiting for next loop
   */
  private applyRealTimeTempoChange(oldTempo: number, newTempo: number): void {
    if (!this.audioContext || !this.currentPattern) return;

    // Calculate tempo ratio for timing adjustment
    const tempoRatio = newTempo / oldTempo;
    const currentTime = this.audioContext.currentTime;
    const elapsedTime = currentTime - this.startTime;

    // Adjust start time to maintain current position with new tempo
    this.startTime = currentTime - (elapsedTime / tempoRatio);

    // Clear existing scheduled events to prevent multiple copies
    this.clearScheduledEvents();

    // Stop all currently playing audio to prevent overlap
    this.stopAllAudio();

    // Restore master gain for immediate audio
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    // Immediately reschedule from current position with new tempo
    this.schedulePattern();

    console.log(`[Unified] Timing adjusted - tempo ratio: ${tempoRatio.toFixed(3)}`);
  }

  /**
   * Apply real-time sequence change
   */
  private applyRealTimeSequenceChange(_oldPattern: ParsedPattern | null, _newPattern: ParsedPattern): void {
    if (!this.audioContext) return;

    console.log(`[Unified] Sequence adjusted for pattern change`);

    // Clear existing scheduled events
    this.clearScheduledEvents();

    // Stop all currently playing audio
    this.stopAllAudio();

    // Restore master gain
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    // Immediately reschedule with new pattern
    this.schedulePattern();
  }

  /**
   * Get current state with real-time calculations
   */
  getState(): UnifiedAudioState {
    const tempo = this.currentPattern?.tempo || 120;
    const volume = this.volumeGain ? 20 * Math.log10(this.volumeGain.gain.value) : -6;

    // Calculate real-time position
    let currentTime = 0;
    if (this.audioContext && this.isPlaying && this.startTime > 0) {
      currentTime = this.audioContext.currentTime - this.startTime;
      // Keep within loop bounds
      const loopDuration = this.getLoopDuration();
      if (loopDuration > 0) {
        currentTime = currentTime % loopDuration;
      }
    } else if (this.isPaused) {
      currentTime = this.pausePosition;
    }

    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      tempo,
      currentTime,
      volume,
      error: null,
      effectsEnabled: false, // TODO: Implement effects
      audioQuality: 'high'
    };
  }

  /**
   * Real-time timing calculations (no pre-calculation)
   */
  private getStepInterval(): number {
    if (!this.currentPattern) return 0;
    const stepsPerBeat = 4; // 16th notes
    const beatsPerMinute = this.currentPattern.tempo;
    const secondsPerBeat = 60 / beatsPerMinute;
    return secondsPerBeat / stepsPerBeat;
  }

  private getLoopDuration(): number {
    if (!this.currentPattern) return 0;
    return this.currentPattern.totalSteps * this.getStepInterval();
  }

  // getCurrentStep method removed - not currently used

  /**
   * Schedule pattern playback with real-time timing
   */
  private schedulePattern(): void {
    if (!this.audioContext || !this.currentPattern) return;

    const timestamp = new Date().toISOString();
    const totalSteps = this.currentPattern.totalSteps;
    const currentTime = this.audioContext.currentTime;
    const stepInterval = this.getStepInterval();
    const loopDuration = this.getLoopDuration();

    // Schedule multiple loops ahead
    const loopsToSchedule = 4;

    // Calculate current position
    const currentPosition = currentTime - this.startTime;
    const currentLoop = Math.floor(currentPosition / loopDuration);
    const currentStepInLoop = Math.floor((currentPosition % loopDuration) / stepInterval);

    console.log(`[${timestamp}] Current position: ${currentPosition.toFixed(3)}s, loop: ${currentLoop}, step: ${currentStepInLoop}`);

    // Schedule loops starting from the current loop
    for (let loop = currentLoop; loop < currentLoop + loopsToSchedule; loop++) {
      const loopStartTime = this.startTime + (loop * loopDuration);

      // Only schedule if the loop start time is in the future or very close to now
      if (loopStartTime >= currentTime - 0.1) { // Allow 100ms lookahead
        console.log(`[${timestamp}] Scheduling loop ${loop} at time ${loopStartTime.toFixed(3)}`);

        // Determine which steps to schedule in this loop
        let startStep = 0;
        let endStep = totalSteps;

        // If this is the current loop, start from the current step
        if (loop === currentLoop) {
          const timeInCurrentLoop = currentTime - loopStartTime;
          const actualCurrentStep = Math.floor(timeInCurrentLoop / stepInterval);
          startStep = Math.max(0, actualCurrentStep);
          console.log(`[${timestamp}] Current loop ${loop}, time in loop: ${timeInCurrentLoop.toFixed(3)}s, starting from step ${startStep}`);
        }

        // Schedule steps in this loop
        for (let step = startStep; step < endStep; step++) {
          const stepTime = loopStartTime + (step * stepInterval);

          // Only schedule if the step time is in the future
          if (stepTime >= currentTime) {
            // Check each instrument for hits at this step
            Object.entries(this.currentPattern.instruments).forEach(([instrumentName, instrumentData]) => {
              // Use modulo to loop the pattern steps if totalSteps > pattern length
              const patternStep = step % instrumentData.steps.length;
              if (instrumentData.steps[patternStep] === true) {
                console.log(`[${timestamp}] Scheduling ${instrumentName} hit at step ${step} (pattern step ${patternStep}), time ${stepTime.toFixed(3)}`);
                this.scheduleInstrumentHit(instrumentName, stepTime);
              }
            });
          }
        }
      }
    }

    // Schedule the next batch of loops
    const nextSchedulingTime = this.startTime + ((currentLoop + Math.floor(loopsToSchedule / 2)) * loopDuration);
    const timeoutDelay = Math.max(0, (nextSchedulingTime - this.audioContext.currentTime) * 1000);

    console.log(`[${timestamp}] Next scheduling at ${nextSchedulingTime.toFixed(3)}, timeout delay: ${timeoutDelay.toFixed(0)}ms`);

    // Only schedule timeout if delay is reasonable
    if (timeoutDelay > 10) {
      const timeoutId = window.setTimeout(() => {
        if (this.isPlaying) {
          const callbackTimestamp = new Date().toISOString();
          console.log(`[${callbackTimestamp}] Scheduling callback triggered, continuing from ${nextSchedulingTime.toFixed(3)}`);
          this.schedulePattern();
        }
      }, timeoutDelay);

      this.scheduledEvents.push(timeoutId);
    }
  }

  /**
   * Schedule an instrument hit
   */
  private scheduleInstrumentHit(instrumentName: string, time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Connect: oscillator -> envelope -> masterGain -> volumeGain -> destination
    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    // Track for immediate stopping
    this.activeOscillators.push(oscillator);

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

        // Track for immediate stopping
        this.activeNoiseSources.push(noise);

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

    // Auto-cleanup when audio ends
    if (typeof oscillator.addEventListener === 'function') {
      const cleanup = () => {
        this.activeOscillators = this.activeOscillators.filter(osc => osc !== oscillator);
      };
      oscillator.addEventListener('ended', cleanup);
    }
  }

  /**
   * Stop all audio immediately
   */
  private stopAllAudio(): void {
    // Stop all active oscillators immediately
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators = [];

    // Stop all active noise sources immediately
    this.activeNoiseSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    });
    this.activeNoiseSources = [];

    // Use master gain for immediate volume cut
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
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
   * Get parameter history for debugging
   */
  getParameterHistory(): ParameterUpdate[] {
    return [...this.parameterHistory];
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const unifiedAudioEngine = UnifiedAudioEngine.getInstance();
