// Basic audio engine for ASCII Generative Sequencer
import * as Tone from 'tone';
import { ParsedPattern } from '../types/audio';
import { PatternParser } from './patternParser';

export class AudioEngine {
  private isInitialized = false;
  private isPlaying = false;
  private currentPattern: ParsedPattern | null = null;
  private transport: typeof Tone.Transport;
  private synthesizers: {
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hihat: Tone.MetalSynth;
  };
  private volume: Tone.Volume;
  private scheduledEvents: number[] = [];

  constructor() {
    // Initialize Tone.js transport
    this.transport = Tone.getTransport();

    // Create simple synthesizers
    this.synthesizers = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }),
      snare: new Tone.NoiseSynth({
        noise: {
          type: 'white'
        },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.01,
          release: 0.1
        }
      }),
      hihat: new Tone.MetalSynth({
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      })
    };

    // Create volume control
    this.volume = new Tone.Volume(-6);

    // Connect synthesizers to volume and output
    Object.values(this.synthesizers).forEach(synth => {
      synth.connect(this.volume);
    });
    this.volume.toDestination();
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
      // Start Tone.js context
      await Tone.start();

      // Set initial tempo
      this.transport.bpm.value = 120;

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
    if (!this.isInitialized) {
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

      // Set tempo
      this.transport.bpm.value = this.currentPattern.tempo;

      // Schedule pattern playback
      this.schedulePattern();

      // Start transport
      this.transport.start();
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

    this.transport.pause();
    this.isPlaying = false;
    console.log('Playback paused');
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.transport.stop();
    this.clearScheduledEvents();
    this.isPlaying = false;
    console.log('Playback stopped');
  }

  /**
   * Set tempo
   */
  setTempo(tempo: number): void {
    const clampedTempo = Math.max(60, Math.min(200, tempo));
    this.transport.bpm.value = clampedTempo;

    if (this.currentPattern) {
      this.currentPattern.tempo = clampedTempo;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(-60, Math.min(0, volume));
    this.volume.volume.value = clampedVolume;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      tempo: this.transport.bpm.value,
      currentTime: this.transport.seconds,
      volume: this.volume.volume.value,
      hasPattern: !!this.currentPattern
    };
  }

  /**
   * Schedule pattern playback
   */
  private schedulePattern(): void {
    if (!this.currentPattern) {
      return;
    }

    const { instruments, totalSteps } = this.currentPattern;
    // Quarter note duration

    // Schedule each instrument
    Object.entries(instruments).forEach(([instrumentName, instrument]) => {
      const synth = this.getSynthesizer(instrumentName);
      if (!synth) {
        console.warn(`No synthesizer found for instrument: ${instrumentName}`);
        return;
      }

      // Schedule hits for each step
      instrument.steps.forEach((isHit, stepIndex) => {
        if (isHit) {
          const time = stepIndex * 0.5; // 0.5 seconds per step at 120 BPM
          const eventId = this.transport.schedule((_time: number) => {
            this.triggerSynthesizer(instrumentName, synth);
          }, time);
          this.scheduledEvents.push(eventId);
        }
      });
    });

    // Schedule loop
    const loopTime = totalSteps * 0.5; // 0.5 seconds per step
    const loopEventId = this.transport.schedule(() => {
      this.schedulePattern(); // Reschedule for next loop
    }, loopTime);
    this.scheduledEvents.push(loopEventId);
  }

  /**
   * Get synthesizer for instrument name
   */
  private getSynthesizer(instrumentName: string) {
    const name = instrumentName.toLowerCase();
    if (name.includes('kick')) return this.synthesizers.kick;
    if (name.includes('snare')) return this.synthesizers.snare;
    if (name.includes('hihat') || name.includes('hat')) return this.synthesizers.hihat;
    return null;
  }

  /**
   * Trigger a synthesizer
   */
  private triggerSynthesizer(instrumentName: string, synth: any): void {
    const name = instrumentName.toLowerCase();

    if (name.includes('kick')) {
      synth.triggerAttackRelease('C1', '8n');
    } else if (name.includes('snare')) {
      synth.triggerAttackRelease('8n');
    } else if (name.includes('hihat') || name.includes('hat')) {
      synth.triggerAttackRelease('C6', '32n');
    }
  }

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(eventId => {
      this.transport.clear(eventId);
    });
    this.scheduledEvents = [];
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    Object.values(this.synthesizers).forEach(synth => synth.dispose());
    this.volume.dispose();
  }
}
