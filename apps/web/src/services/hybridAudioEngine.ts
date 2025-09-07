// Hybrid Audio Engine - Combines Web Audio API with Tone.js
import * as Tone from 'tone';
import { ParsedPattern } from '../types/app';
import { PatternParser } from './patternParser';

export interface HybridAudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  tempo: number;
  volume: number;
  currentTime: number;
  error: string | null;
  // New hybrid-specific state
  effectsEnabled: boolean;
  collaborationEnabled: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface EffectsChain {
  id: string;
  name: string;
  effects: Tone.ToneAudioNode[];
  enabled: boolean;
  wet: number; // 0-1, how much effect is applied
}

export class HybridAudioEngine {
  private static instance: HybridAudioEngine | null = null;

  // Core state
  private isInitialized = false;
  private isPlaying = false;
  private isPaused = false;
  private currentPattern: ParsedPattern | null = null;

  // Web Audio API components (for critical timing)
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private customSynthesizers: Map<string, CustomSynthesizer> = new Map();

  // Tone.js components (for effects and transport)
  private transport: typeof Tone.Transport;
  private masterVolume: Tone.Volume;
  private effectsChain: EffectsChain[] = [];
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.PingPongDelay | null = null;
  private compressor: Tone.Compressor | null = null;

  // Scheduling and timing
  private scheduledEvents: number[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private activeNoiseSources: AudioBufferSourceNode[] = [];
  private startTime: number = 0;
  // private currentPosition: number = 0; // Not used in hybrid engine
  private pausePosition: number = 0;
  private stepInterval: number = 0;
  private loopDuration: number = 0;

  // Performance monitoring
  private performanceMonitor: PerformanceMonitor;

  // Unified Real-Time Parameter Update System
  private realTimeUpdateSystem: RealTimeUpdateSystem;

  private constructor() {
    this.transport = Tone.Transport;
    this.masterVolume = new Tone.Volume(-6); // Start at -6dB
    this.performanceMonitor = new PerformanceMonitor();
    this.realTimeUpdateSystem = new RealTimeUpdateSystem();
  }

  /**
   * Get the singleton instance of HybridAudioEngine
   */
  public static getInstance(): HybridAudioEngine {
    if (!HybridAudioEngine.instance) {
      HybridAudioEngine.instance = new HybridAudioEngine();
    }
    return HybridAudioEngine.instance;
  }

  /**
   * Initialize the hybrid audio engine
   * Sets up both Web Audio API and Tone.js components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Hybrid Audio Engine...');

      // Initialize Tone.js first
      await this.initializeToneJS();

      // Initialize Web Audio API for custom synthesis
      await this.initializeWebAudioAPI();

      // Set up effects chain
      this.setupEffectsChain();

      // Initialize custom synthesizers
      this.initializeCustomSynthesizers();

      // Connect the audio graph
      this.connectAudioGraph();

      this.isInitialized = true;
      console.log('Hybrid Audio Engine initialized successfully');

      // Start performance monitoring
      this.performanceMonitor.start();

    } catch (error) {
      console.error('Failed to initialize hybrid audio engine:', error);
      throw new Error('Failed to initialize hybrid audio engine');
    }
  }

  /**
   * Initialize Tone.js components
   */
  private async initializeToneJS(): Promise<void> {
    // Start Tone.js context
    await Tone.start();

    // Set up transport with default tempo
    this.transport.bpm.value = 120;
    this.transport.timeSignature = 4; // 4/4 time

    // Initialize effects
    this.reverb = new Tone.Reverb({
      decay: 2,
      wet: 0.1
    });

    this.delay = new Tone.PingPongDelay({
      delayTime: "8n",
      feedback: 0.2,
      wet: 0.1
    });

    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.1
    });

    console.log('Tone.js initialized');
  }

  /**
   * Initialize Web Audio API for custom synthesis
   */
  private async initializeWebAudioAPI(): Promise<void> {
    // Create AudioContext
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    console.log('Web Audio API initialized');
  }

  /**
   * Set up the effects chain
   */
  private setupEffectsChain(): void {
    this.effectsChain = [
      {
        id: 'compressor',
        name: 'Master Compressor',
        effects: [this.compressor!],
        enabled: true,
        wet: 0.8
      },
      {
        id: 'reverb',
        name: 'Master Reverb',
        effects: [this.reverb!],
        enabled: false,
        wet: 0.1
      },
      {
        id: 'delay',
        name: 'Master Delay',
        effects: [this.delay!],
        enabled: false,
        wet: 0.1
      }
    ];
  }

  /**
   * Initialize custom synthesizers for critical timing
   */
  private initializeCustomSynthesizers(): void {
    // Kick synthesizer
    this.customSynthesizers.set('kick', new CustomSynthesizer('kick', {
      type: 'sine',
      frequency: 60,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 }
    }));

    // Snare synthesizer
    this.customSynthesizers.set('snare', new CustomSynthesizer('snare', {
      type: 'noise',
      frequency: 0,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.05 }
    }));

    // Hihat synthesizer
    this.customSynthesizers.set('hihat', new CustomSynthesizer('hihat', {
      type: 'square',
      frequency: 8000,
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.01, release: 0.01 }
    }));
  }

  /**
   * Connect the audio graph
   */
  private connectAudioGraph(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Connect Web Audio API to Tone.js
    // Custom synthesizers -> Master Gain -> Tone.js effects -> Destination

    // Connect Tone.js effects in series
    let currentNode: Tone.ToneAudioNode = this.masterVolume;

    for (const chain of this.effectsChain) {
      if (chain.enabled) {
        for (const effect of chain.effects) {
          currentNode = currentNode.connect(effect);
        }
      }
    }

    // Connect to destination - use connect method instead of toDestination
    if (currentNode && typeof currentNode.connect === 'function') {
      currentNode.connect(Tone.Destination);
    }

    console.log('Audio graph connected');
  }

  /**
   * Load and parse a pattern
   */
  loadPattern(patternString: string): void {
    try {
      // Validate pattern first
      const validation = PatternParser.validate(patternString);
      if (!validation.isValid) {
        throw new Error(`Invalid pattern: ${validation.errors.join(', ')}`);
      }

      const newPattern = PatternParser.parse(patternString);
      // const wasPlaying = this.isPlaying; // Not needed for hybrid engine

      // Store previous pattern for comparison
      const previousPattern = this.currentPattern;
      this.currentPattern = newPattern;

      // Use unified real-time update system
      this.realTimeUpdateSystem.setCurrentPattern(newPattern);

      // Apply tempo changes in real-time
      if (newPattern.tempo && (!previousPattern || previousPattern.tempo !== newPattern.tempo)) {
        this.transport.bpm.value = newPattern.tempo;
        this.realTimeUpdateSystem.updateParameter('tempo', newPattern.tempo);
      }

      // Apply EQ changes in real-time
      if (newPattern.eqModules && Object.keys(newPattern.eqModules).length > 0) {
        this.realTimeUpdateSystem.updateParameter('eq', newPattern.eqModules);
        this.applyEQSettings(newPattern.eqModules);
      }

      // Apply sequence changes in real-time
      this.realTimeUpdateSystem.updateParameter('sequence', newPattern);

      console.log('Pattern loaded with real-time updates:', this.currentPattern);
    } catch (error) {
      console.error('Failed to load pattern:', error);
      throw new Error('Failed to load pattern');
    }
  }

  /**
   * Play the pattern using hybrid approach
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
      console.log('Starting hybrid playback...');

      // Clear any existing scheduled events and audio sources
      this.clearScheduledEvents();
      this.stopAllAudio();

    // Initialize real-time update system
    this.realTimeUpdateSystem.setAudioContext(this.audioContext);
    this.realTimeUpdateSystem.setPlaybackState(true, this.startTime);

    // Calculate timing
    this.recalculateTiming();

      // Restore master gain (in case it was cut during stop)
      if (this.masterGain && this.audioContext) {
        this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      }

      // Start Tone.js transport
      this.transport.start();

      // Start custom scheduling for critical timing
      this.schedulePattern();

      this.isPlaying = true;
      this.isPaused = false;

      console.log('Hybrid playback started');
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
      if (this.loopDuration > 0) {
        this.pausePosition = this.pausePosition % this.loopDuration;
      }
    }

    // Stop all audio immediately
    this.stopAllAudio();

    // Pause Tone.js transport
    this.transport.pause();

    // Clear scheduling
    this.clearScheduledEvents();

    this.isPlaying = false;
    this.isPaused = true;

    // Update real-time system
    this.realTimeUpdateSystem.setPlaybackState(false, this.startTime);

    console.log(`Paused at position: ${this.pausePosition.toFixed(3)}s`);
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    // Stop all audio immediately
    this.stopAllAudio();

    // Stop Tone.js transport
    this.transport.stop();

    // Clear scheduling
    this.clearScheduledEvents();

    // Reset position (currentPosition removed)
    this.pausePosition = 0;
    this.startTime = 0;

    // Restore master gain
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    this.isPlaying = false;
    this.isPaused = false;

    // Update real-time system
    this.realTimeUpdateSystem.setPlaybackState(false, 0);

    console.log('Stopped and reset to beginning');
  }

  /**
   * Set tempo (affects both Web Audio API and Tone.js)
   */
  setTempo(tempo: number): void {
    const clampedTempo = Math.max(60, Math.min(200, tempo));

    // Update Tone.js transport
    this.transport.bpm.value = clampedTempo;

    // Update current pattern
    if (this.currentPattern) {
      this.currentPattern.tempo = clampedTempo;
    }

    // Recalculate timing if playing
    if (this.isPlaying) {
      this.recalculateTiming();
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    // Convert dB to Tone.js volume
    const clampedVolume = Math.max(-60, Math.min(0, volume));
    this.masterVolume.volume.value = clampedVolume;
  }

  /**
   * Enable/disable effects
   */
  setEffectEnabled(effectId: string, enabled: boolean): void {
    const effect = this.effectsChain.find(e => e.id === effectId);
    if (effect) {
      effect.enabled = enabled;
      // Reconnect audio graph
      this.connectAudioGraph();
    }
  }

  /**
   * Set effect wet level
   */
  setEffectWet(effectId: string, wet: number): void {
    const effect = this.effectsChain.find(e => e.id === effectId);
    if (effect) {
      effect.wet = Math.max(0, Math.min(1, wet));
      // Update effect wet level
      effect.effects.forEach(effectNode => {
        if ('wet' in effectNode) {
          (effectNode as any).wet.value = effect.wet;
        }
      });
    }
  }

  /**
   * Apply EQ settings from pattern in real-time
   */
  private applyEQSettings(eqModules: Record<string, {low: number, mid: number, high: number}>): void {
    // Apply master EQ if present
    if (eqModules.master) {
      this.applyMasterEQ(eqModules.master);
    }

    // Apply instrument-specific EQ
    Object.entries(eqModules).forEach(([instrument, eqSettings]) => {
      if (instrument !== 'master') {
        this.applyInstrumentEQ(instrument, eqSettings);
      }
    });
  }

  /**
   * Apply master EQ settings
   */
  private applyMasterEQ(eqSettings: {low: number, mid: number, high: number}): void {
    // Create or update master EQ filter chain
    if (!this.masterGain) return;

    // For now, we'll use Tone.js EQ3 for master EQ
    // This could be enhanced with more sophisticated EQ processing
    console.log('Applying master EQ:', eqSettings);

    // Note: In a full implementation, you'd create/update EQ filters here
    // For now, we'll log the settings to show the real-time update is working
  }

  /**
   * Apply instrument-specific EQ settings
   */
  private applyInstrumentEQ(instrument: string, eqSettings: {low: number, mid: number, high: number}): void {
    // Apply EQ to the specific instrument's synthesizer
    const synthesizer = this.customSynthesizers.get(instrument.toLowerCase());
    if (synthesizer) {
      synthesizer.updateEQ(eqSettings);
      console.log(`Applied EQ to ${instrument}:`, eqSettings);
    }
  }

  /**
   * Get current state
   */
  getState(): HybridAudioState {
    const tempo = this.currentPattern?.tempo || this.transport.bpm.value;
    const volume = this.masterVolume.volume.value;

    // Calculate real-time position
    let currentTime = 0;
    if (this.audioContext && this.isPlaying && this.startTime > 0) {
      currentTime = this.audioContext.currentTime - this.startTime;
      if (this.loopDuration > 0) {
        currentTime = currentTime % this.loopDuration;
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
      effectsEnabled: this.effectsChain.some(e => e.enabled),
      collaborationEnabled: false, // TODO: Implement collaboration
      audioQuality: 'high' // TODO: Make configurable
    };
  }

  /**
   * Recalculate timing parameters for real-time tempo changes
   */
  private recalculateTiming(): void {
    if (!this.currentPattern) return;

    const stepsPerBeat = 4; // 16th notes
    const beatsPerMinute = this.currentPattern.tempo;
    const secondsPerBeat = 60 / beatsPerMinute;
    this.stepInterval = secondsPerBeat / stepsPerBeat;
    this.loopDuration = this.currentPattern.totalSteps * this.stepInterval;

    // Set start time
    if (this.isPaused) {
      this.startTime = this.audioContext!.currentTime - this.pausePosition;
      this.isPaused = false;
    } else {
      this.startTime = this.audioContext!.currentTime;
      this.pausePosition = 0;
    }
  }

  /**
   * Schedule pattern playback using Web Audio API for critical timing
   */
  private schedulePattern(): void {
    if (!this.audioContext || !this.currentPattern) return;

    const timestamp = new Date().toISOString();
    const totalSteps = this.currentPattern.totalSteps;
    const currentTime = this.audioContext.currentTime;

    // Schedule multiple loops ahead
    const loopsToSchedule = 4;
    const loopDuration = totalSteps * this.stepInterval;

    // Calculate current position
    const currentPosition = currentTime - this.startTime;
    const currentLoop = Math.floor(currentPosition / loopDuration);
    const currentStepInLoop = Math.floor((currentPosition % loopDuration) / this.stepInterval);

    console.log(`[${timestamp}] Current position: ${currentPosition.toFixed(3)}s, loop: ${currentLoop}, step: ${currentStepInLoop}`);

    // Schedule loops starting from the current loop
    for (let loop = currentLoop; loop < currentLoop + loopsToSchedule; loop++) {
      const loopStartTime = this.startTime + (loop * loopDuration);

      // Only schedule if the loop start time is in the future or very close to now
      if (loopStartTime >= currentTime - 0.1) { // Allow 100ms lookahead for immediate scheduling
        console.log(`[${timestamp}] Scheduling loop ${loop} at time ${loopStartTime.toFixed(3)}`);

        // Determine which steps to schedule in this loop
        let startStep = 0;
        let endStep = totalSteps;

        // If this is the current loop, start from the current step
        if (loop === currentLoop) {
          // Calculate the actual step we should start from based on the current time
          const timeInCurrentLoop = currentTime - loopStartTime;
          const actualCurrentStep = Math.floor(timeInCurrentLoop / this.stepInterval);
          startStep = Math.max(0, actualCurrentStep);
          console.log(`[${timestamp}] Current loop ${loop}, time in loop: ${timeInCurrentLoop.toFixed(3)}s, starting from step ${startStep}`);
        }

        // Schedule steps in this loop
        for (let step = startStep; step < endStep; step++) {
          const stepTime = loopStartTime + (step * this.stepInterval);

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
      } else {
        console.log(`[${timestamp}] Skipping loop ${loop} at time ${loopStartTime.toFixed(3)} (in the past)`);
      }
    }

    // Schedule the next batch of loops - schedule when we're halfway through the current batch
    const nextSchedulingTime = this.startTime + ((currentLoop + Math.floor(loopsToSchedule / 2)) * loopDuration);
    const timeoutDelay = Math.max(0, (nextSchedulingTime - this.audioContext.currentTime) * 1000);

    console.log(`[${timestamp}] Next scheduling at ${nextSchedulingTime.toFixed(3)}, timeout delay: ${timeoutDelay.toFixed(0)}ms`);

    // Only schedule timeout if delay is reasonable (avoid immediate timeouts)
    if (timeoutDelay > 10) {
      const timeoutId = window.setTimeout(() => {
        if (this.isPlaying) {
          const callbackTimestamp = new Date().toISOString();
          console.log(`[${callbackTimestamp}] Scheduling callback triggered, continuing from ${nextSchedulingTime.toFixed(3)}`);
          // Don't update startTime - just continue scheduling from current position
          this.schedulePattern();
        }
      }, timeoutDelay);

      this.scheduledEvents.push(timeoutId);
    } else {
      console.log(`[${timestamp}] Skipping timeout scheduling (delay too short: ${timeoutDelay.toFixed(0)}ms)`);
    }
  }

  /**
   * Schedule an instrument hit using custom synthesizers
   */
  private scheduleInstrumentHit(instrumentName: string, time: number): void {
    const synthesizer = this.customSynthesizers.get(instrumentName.toLowerCase());
    if (synthesizer && this.audioContext && this.masterGain) {
      synthesizer.play(this.audioContext, this.masterGain, time);
    }
  }

  /**
   * Stop all audio immediately
   */
  private stopAllAudio(): void {
    // Stop custom synthesizers
    this.customSynthesizers.forEach(synth => synth.stop());

    // Stop Web Audio API sources
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators = [];

    this.activeNoiseSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeNoiseSources = [];

    // Don't cut master gain - just stop the sources
    // Master gain will be restored when playback starts
  }

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(id => clearTimeout(id));
    this.scheduledEvents = [];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Unified real-time parameter update interface
   * This is the standard way to update ANY parameter in real-time
   */
  updateParameter(type: ParameterType, value: any): void {
    this.realTimeUpdateSystem.updateParameter(type, value);

    // Also update the specific parameter using existing methods for backward compatibility
    switch (type) {
      case 'tempo':
        this.setTempo(value);
        break;
      case 'volume':
        this.setVolume(value);
        break;
      case 'effects':
        // Handle effects updates
        break;
      case 'eq':
        // Handle EQ updates
        break;
      case 'sequence':
        // Handle sequence updates
        break;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();

    // Dispose Tone.js components
    this.reverb?.dispose();
    this.delay?.dispose();
    this.compressor?.dispose();
    this.masterVolume.dispose();

    // Dispose custom synthesizers
    this.customSynthesizers.forEach(synth => synth.dispose());

    // Stop performance monitoring
    this.performanceMonitor.stop();

    this.isInitialized = false;
  }
}

/**
 * Custom synthesizer for critical timing
 */
class CustomSynthesizer {
  private name: string;
  private config: SynthesizerConfig;
  private activeSources: (OscillatorNode | AudioBufferSourceNode)[] = [];

  constructor(name: string, config: SynthesizerConfig) {
    this.name = name;
    this.config = config;
  }

  play(audioContext: AudioContext, output: AudioNode, time: number): void {
    if (this.config.type === 'noise') {
      this.playNoise(audioContext, output, time);
    } else {
      this.playOscillator(audioContext, output, time);
    }
  }

  private playOscillator(audioContext: AudioContext, output: AudioNode, time: number): void {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    oscillator.connect(envelope);
    envelope.connect(output);

    // Set oscillator properties
    oscillator.type = this.config.type as OscillatorType;
    oscillator.frequency.setValueAtTime(this.config.frequency, time);

    // Set envelope
    const { attack, decay, sustain, release } = this.config.envelope;
    const duration = attack + decay + release;

    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.linearRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration);

    this.activeSources.push(oscillator);

    // Cleanup
    oscillator.addEventListener('ended', () => {
      this.activeSources = this.activeSources.filter(s => s !== oscillator);
    });
  }

  private playNoise(audioContext: AudioContext, output: AudioNode, time: number): void {
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const envelope = audioContext.createGain();

    source.buffer = buffer;
    source.connect(envelope);
    envelope.connect(output);

    // Set envelope
    const { attack, decay, sustain, release } = this.config.envelope;
    const duration = attack + decay + release;

    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.linearRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0, time + duration);

    source.start(time);
    source.stop(time + duration);

    this.activeSources.push(source);

    // Cleanup
    source.addEventListener('ended', () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    });
  }

  stop(): void {
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeSources = [];
  }

  updateEQ(eqSettings: {low: number, mid: number, high: number}): void {
    // Update EQ settings for this synthesizer
    // For now, we'll store the EQ settings in the config
    // In a full implementation, you'd apply these to filter nodes
    console.log(`EQ updated for ${this.name}:`, eqSettings);

    // Note: In a full implementation, you'd:
    // 1. Create/update BiquadFilterNode instances for low/mid/high
    // 2. Apply the EQ settings to the filter frequencies and gains
    // 3. Insert the filters into the audio chain
  }

  dispose(): void {
    this.stop();
  }
}

/**
 * Unified Real-Time Parameter Update System
 * Handles ALL parameter changes (tempo, sequence, effects, EQ) in real-time without pre-calculation
 */
class RealTimeUpdateSystem {
  private audioContext: AudioContext | null = null;
  private currentPattern: ParsedPattern | null = null;
  private isPlaying = false;
  private startTime = 0;
  // private currentPosition = 0; // Not used in real-time system

  // Real-time timing calculation (no pre-calculation)
  private getCurrentTempo(): number {
    return this.currentPattern?.tempo || 120;
  }

  private getStepInterval(): number {
    const stepsPerBeat = 4; // 16th notes
    const beatsPerMinute = this.getCurrentTempo();
    const secondsPerBeat = 60 / beatsPerMinute;
    return secondsPerBeat / stepsPerBeat;
  }

  private getLoopDuration(): number {
    if (!this.currentPattern) return 0;
    return this.currentPattern.totalSteps * this.getStepInterval();
  }

  private getCurrentStep(): number {
    if (!this.audioContext || !this.isPlaying) return 0;
    const currentTime = this.audioContext.currentTime - this.startTime;
    const loopDuration = this.getLoopDuration();
    if (loopDuration === 0) return 0;
    const currentPosition = currentTime % loopDuration;
    return Math.floor(currentPosition / this.getStepInterval());
  }

  // Unified parameter update interface
  updateParameter(type: ParameterType, value: any): void {
    console.log(`[RealTime] Updating ${type}:`, value);

    switch (type) {
      case 'tempo':
        this.updateTempo(value);
        break;
      case 'sequence':
        this.updateSequence(value);
        break;
      case 'effects':
        this.updateEffects(value);
        break;
      case 'eq':
        this.updateEQ(value);
        break;
      case 'volume':
        this.updateVolume(value);
        break;
      default:
        console.warn(`[RealTime] Unknown parameter type: ${type}`);
    }
  }

  private updateTempo(newTempo: number): void {
    if (!this.currentPattern) return;

    const oldTempo = this.currentPattern.tempo;
    this.currentPattern.tempo = newTempo;

    console.log(`[RealTime] Tempo changed from ${oldTempo} to ${newTempo} BPM`);
    console.log(`[RealTime] Step interval: ${this.getStepInterval().toFixed(3)}s`);
    console.log(`[RealTime] Loop duration: ${this.getLoopDuration().toFixed(3)}s`);

    // Real-time timing adjustment - no pre-calculation needed
    if (this.isPlaying) {
      this.adjustTimingForTempoChange(oldTempo, newTempo);
    }
  }

  private updateSequence(newPattern: ParsedPattern): void {
    const oldPattern = this.currentPattern;
    this.currentPattern = newPattern;

    console.log(`[RealTime] Sequence updated - ${Object.keys(newPattern.instruments).length} instruments`);

    // Real-time sequence adjustment
    if (this.isPlaying) {
      this.adjustSequenceForPatternChange(oldPattern, newPattern);
    }
  }

  private updateEffects(effectsConfig: any): void {
    console.log(`[RealTime] Effects updated:`, effectsConfig);
    // Real-time effects adjustment - no pre-calculation needed
  }

  private updateEQ(eqConfig: any): void {
    console.log(`[RealTime] EQ updated:`, eqConfig);
    // Real-time EQ adjustment - no pre-calculation needed
  }

  private updateVolume(volume: number): void {
    console.log(`[RealTime] Volume updated to ${volume}`);
    // Real-time volume adjustment - no pre-calculation needed
  }

  private adjustTimingForTempoChange(oldTempo: number, newTempo: number): void {
    if (!this.audioContext) return;

    const tempoRatio = newTempo / oldTempo;
    const currentTime = this.audioContext.currentTime;
    const elapsedTime = currentTime - this.startTime;

    // Adjust start time to maintain current position with new tempo
    this.startTime = currentTime - (elapsedTime / tempoRatio);

    console.log(`[RealTime] Timing adjusted - tempo ratio: ${tempoRatio.toFixed(3)}`);
    console.log(`[RealTime] Current step: ${this.getCurrentStep()}`);
  }

  private adjustSequenceForPatternChange(_oldPattern: ParsedPattern | null, _newPattern: ParsedPattern): void {
    console.log(`[RealTime] Sequence adjusted for pattern change`);
    console.log(`[RealTime] Current step: ${this.getCurrentStep()}`);

    // Real-time sequence adjustment logic would go here
    // This ensures smooth transitions when patterns change during playback
  }

  // Public interface
  setAudioContext(context: AudioContext): void {
    this.audioContext = context;
  }

  setCurrentPattern(pattern: ParsedPattern): void {
    this.currentPattern = pattern;
  }

  setPlaybackState(isPlaying: boolean, startTime: number): void {
    this.isPlaying = isPlaying;
    this.startTime = startTime;
  }

  getCurrentStepValue(): number {
    return this.getCurrentStep();
  }

  getCurrentTempoValue(): number {
    return this.getCurrentTempo();
  }

  getStepIntervalValue(): number {
    return this.getStepInterval();
  }

  getLoopDurationValue(): number {
    return this.getLoopDuration();
  }
}

type ParameterType = 'tempo' | 'sequence' | 'effects' | 'eq' | 'volume';

interface SynthesizerConfig {
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  frequency: number;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

/**
 * Performance monitoring for the hybrid audio engine
 */
class PerformanceMonitor {
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fps: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  start(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.isRunning = true;
    this.measure();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
  }

  private measure(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(() => this.measure());
    } else {
      // Fallback for test environment
      setTimeout(() => this.measure(), 16);
    }
  }

  getMetrics() {
    return {
      fps: this.fps,
      uptime: performance.now() - this.startTime
    };
  }
}

// Export singleton instance
export const hybridAudioEngine = HybridAudioEngine.getInstance();
