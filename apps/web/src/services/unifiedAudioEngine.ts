// Unified Audio Engine - Real-time everything, no pre-calculation
import { ParsedPattern, UnifiedAudioState, LFOModule, FilterModule, DelayModule, ReverbModule, PanModule, DistortModule, ChorusModule, PhaserModule } from '../types/app';
import { PatternParser } from './patternParser';
import { AUDIO_CONSTANTS } from '@ascii-sequencer/shared';

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
  // Master effects chain
  private masterEQLow: BiquadFilterNode | null = null;
  private masterEQMid: BiquadFilterNode | null = null;
  private masterEQHigh: BiquadFilterNode | null = null;
  private masterComp: DynamicsCompressorNode | null = null;
  private masterPreGain: GainNode | null = null; // for master amp
  private masterChainInput: AudioNode | null = null; // first node in chain
  // Master effects: Distortion, Delay, Reverb (inserted between Comp and PreGain)
  private masterDistortion: WaveShaperNode | null = null;
  private masterDistortDryGain: GainNode | null = null;
  private masterDistortWetGain: GainNode | null = null;
  private masterDistortMerge: GainNode | null = null;
  private masterDelay: DelayNode | null = null;
  private masterDelayFeedback: GainNode | null = null;
  private masterDelayDryGain: GainNode | null = null;
  private masterDelayWetGain: GainNode | null = null;
  private masterDelayMerge: GainNode | null = null;
  private masterReverb: ConvolverNode | null = null;
  private masterReverbDryGain: GainNode | null = null;
  private masterReverbWetGain: GainNode | null = null;
  private masterReverbMerge: GainNode | null = null;

  // Per-instrument chains
  private instrumentChains: Map<string, {
    preGain: GainNode;
    filter: BiquadFilterNode;
    comp: DynamicsCompressorNode;
    eqLow: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqHigh: BiquadFilterNode;
    pan: StereoPannerNode;
    input: AudioNode; // alias to preGain
    output: AudioNode; // pan
  }> = new Map();

  // LFOs
  private lfoMap: Map<string, {
    osc: OscillatorNode;
    depthGain: GainNode;
    targetParam: AudioParam;
    scope: 'master' | 'instrument';
    name: string;
    wave: OscillatorType;
    rateHz: number;
    depth: number;
  }> = new Map();

  // Real-time timing system (no pre-calculation)
  private startTime: number = 0;
  private pausePosition: number = 0;

  // Audio sources and scheduling
  private activeOscillators: OscillatorNode[] = [];
  private activeNoiseSources: AudioBufferSourceNode[] = [];
  private scheduledEvents: number[] = [];
  // Track sources scheduled to start in the future so we can cancel them on live edits
  private pendingSources: Array<{ startTime: number; instrument: string; stop: () => void }>
    = [];

  // Real-time parameter system
  private parameterHistory: ParameterUpdate[] = [];
  private maxParameterHistory = 100;

  // Scheduling behavior for instruments shorter than the longest track
  // 'loop': shorter instruments wrap using modulo (default)
  // 'rest': shorter instruments are silent beyond their length
  private overflowMode: 'loop' | 'rest' = 'loop';

  // Samples
  private sampleBuffers: Map<string, AudioBuffer> = new Map(); // sampleName -> buffer

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

      // Ensure master chain
      this.ensureMasterChain();

      // Connect: masterGain -> volumeGain -> destination
      this.masterGain.connect(this.volumeGain);
      this.volumeGain.connect(this.audioContext.destination);

      // Preload a minimal sample bank (procedurally generated for MVP)
      await this.preloadDefaultSamples();

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

      // Apply EQ changes in real-time (always pass object to allow reset)
      this.updateParameter('eq', newPattern.eqModules || {});

      // Apply effects changes in real-time (amp/comp/lfo/filter/delay/reverb/pan/distort)
      this.updateParameter('effects', {
        amp: newPattern.ampModules || {},
        comp: newPattern.compModules || {},
        lfo: newPattern.lfoModules || {},
        filter: newPattern.filterModules || {},
        delay: newPattern.delayModules || {},
        reverb: newPattern.reverbModules || {},
        pan: newPattern.panModules || {},
        distort: newPattern.distortModules || {},
      });

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
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    // Master AMP
    const masterAmp = effectsConfig?.amp?.['master'];
    if (masterAmp && this.masterPreGain) {
      const linear = this.stepsToLinear(masterAmp.gain);
      this.masterPreGain.gain.setValueAtTime(linear, now);
      // Update any LFO targeting master.amp scaling
      const lfoKey = 'master.amp';
      const lfo = this.lfoMap.get(lfoKey);
      if (lfo) {
        lfo.depthGain.gain.setValueAtTime(linear * (lfo.depth || 0), now);
      }
    } else if (this.masterPreGain) {
      // Reset to neutral if no master amp provided
      this.masterPreGain.gain.setValueAtTime(1, now);
    }

    // Master COMP
    const masterComp = effectsConfig?.comp?.['master'];
    if (this.masterComp) {
      if (masterComp) {
        this.masterComp.threshold.setValueAtTime(masterComp.threshold, now);
        this.masterComp.ratio.setValueAtTime(masterComp.ratio, now);
        this.masterComp.attack.setValueAtTime(masterComp.attack, now);
        this.masterComp.release.setValueAtTime(masterComp.release, now);
        this.masterComp.knee.setValueAtTime(masterComp.knee, now);
      } else {
        // Reset to mild default
        this.masterComp.threshold.setValueAtTime(-24, now);
        this.masterComp.ratio.setValueAtTime(4, now);
        this.masterComp.attack.setValueAtTime(0.01, now);
        this.masterComp.release.setValueAtTime(0.25, now);
        this.masterComp.knee.setValueAtTime(30, now);
      }
    }

    // Per-instrument AMP/COMP
    const ampMods = effectsConfig?.amp || {};
    const compMods = effectsConfig?.comp || {};
    const lfoMods = effectsConfig?.lfo || {};

    const filterMods = effectsConfig?.filter || {};
    const delayMods = effectsConfig?.delay || {};
    const reverbMods = effectsConfig?.reverb || {};
    const panMods = effectsConfig?.pan || {};
    const distortMods = effectsConfig?.distort || {};

    // Determine which instruments need chains (if any of amp/comp/eq/lfo/filter/pan present)
    if (this.currentPattern) {
      const names = new Set<string>(
        Object.keys(this.currentPattern?.instruments || {})
      );
      Object.keys(this.currentPattern?.eqModules || {}).forEach(n => names.add(n.toLowerCase()));
      Object.keys(ampMods).forEach((n: string) => names.add(n.toLowerCase()));
      Object.keys(compMods).forEach((n: string) => names.add(n.toLowerCase()));
      Object.keys(filterMods).forEach((n: string) => names.add(n.toLowerCase()));
      Object.keys(panMods).forEach((n: string) => names.add(n.toLowerCase()));
      Object.values(lfoMods as Record<string, LFOModule>).forEach(l => {
        if (l.scope === 'instrument') names.add(l.name.toLowerCase());
      });
      names.forEach(n => {
        if (n !== 'master') this.ensureInstrumentChain(n);
      });
    }

    // Apply per-instrument AMP
    Object.entries(ampMods as Record<string, { gain: number }>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        const linear = this.stepsToLinear(cfg.gain);
        chain.preGain.gain.setValueAtTime(linear, now);
        // Update LFO depth scaling if present
        const lfoKey = `${lower}.amp`;
        const lfo = this.lfoMap.get(lfoKey);
        if (lfo) {
          lfo.depthGain.gain.setValueAtTime(linear * (lfo.depth || 0), now);
        }
      }
    });

    // Apply per-instrument COMP
    Object.entries(compMods as Record<string, any>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        chain.comp.threshold.setValueAtTime(cfg.threshold, now);
        chain.comp.ratio.setValueAtTime(cfg.ratio, now);
        chain.comp.attack.setValueAtTime(cfg.attack, now);
        chain.comp.release.setValueAtTime(cfg.release, now);
        chain.comp.knee.setValueAtTime(cfg.knee, now);
      }
    });

    // Apply/Update LFOs targeting amp
    const lfoEntries = Object.values(lfoMods as Record<string, LFOModule>);
    lfoEntries.forEach((lfoCfg) => {
      this.updateLFO(lfoCfg);
    });

    // Dispose any LFOs no longer present
    const newLfoKeys = new Set(lfoEntries.map(l => l.key.toLowerCase()));
    Array.from(this.lfoMap.keys()).forEach((key) => {
      if (!newLfoKeys.has(key)) {
        this.disposeLFO(key);
      }
    });

    // Apply per-instrument FILTER
    Object.entries(filterMods as Record<string, FilterModule>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      if (lower === 'master') return;
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        chain.filter.type = cfg.type as BiquadFilterType;
        chain.filter.frequency.setValueAtTime(cfg.freq, now);
        chain.filter.Q.setValueAtTime(cfg.Q, now);
      }
    });

    // Apply per-instrument PAN
    Object.entries(panMods as Record<string, PanModule>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      if (lower === 'master') return;
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        chain.pan.pan.setValueAtTime(cfg.value, now);
      }
    });

    // Apply per-instrument DELAY (send-style: insert a delay node in the instrument chain)
    Object.entries(delayMods as Record<string, DelayModule>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      if (lower === 'master') return;
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        // Create per-instrument delay if not exists
        if (!(chain as any).__delay) {
          const dly = this.audioContext!.createDelay(2.0);
          const fb = this.audioContext!.createGain();
          const dryG = this.audioContext!.createGain();
          const wetG = this.audioContext!.createGain();
          const merge = this.audioContext!.createGain();

          // Disconnect pan from current destination and re-route through delay
          try { chain.pan.disconnect(); } catch {}
          chain.pan.connect(dryG);
          chain.pan.connect(dly);
          dly.connect(fb);
          fb.connect(dly);
          dly.connect(wetG);
          dryG.connect(merge);
          wetG.connect(merge);

          this.ensureMasterChain();
          if (this.masterChainInput) {
            merge.connect(this.masterChainInput);
          } else if (this.masterGain) {
            merge.connect(this.masterGain!);
          }

          (chain as any).__delay = dly;
          (chain as any).__delayFb = fb;
          (chain as any).__delayDry = dryG;
          (chain as any).__delayWet = wetG;
        }
        (chain as any).__delay.delayTime.setValueAtTime(cfg.time, now);
        (chain as any).__delayFb.gain.setValueAtTime(cfg.feedback, now);
        (chain as any).__delayDry.gain.setValueAtTime(1 - cfg.mix, now);
        (chain as any).__delayWet.gain.setValueAtTime(cfg.mix, now);
      }
    });

    // Apply per-instrument REVERB (convolution-based)
    Object.entries(reverbMods as Record<string, ReverbModule>).forEach(([name, cfg]) => {
      const lower = name.toLowerCase();
      if (lower === 'master') return;
      const chain = this.instrumentChains.get(lower);
      if (chain) {
        if (!(chain as any).__reverb) {
          const rev = this.audioContext!.createConvolver();
          rev.buffer = this.generateImpulseResponse(cfg.decay, cfg.predelay);
          const dryG = this.audioContext!.createGain();
          const wetG = this.audioContext!.createGain();
          const merge = this.audioContext!.createGain();


          // Route from pan (or delay merge) through reverb

          try {
            // Only if no delay is present, disconnect pan
            if (!(chain as any).__delay) {
              chain.pan.disconnect();
            }
          } catch {}

          if (!(chain as any).__delay) {
            chain.pan.connect(dryG);
            chain.pan.connect(rev);
          } else {
            // Re-use existing routing; add reverb after delay merge in parallel
            // This is simpler: just apply reverb as a wet signal from the instrument output
            chain.pan.connect(rev);
            chain.pan.connect(dryG); // dry already connected via delay
          }

          rev.connect(wetG);
          dryG.connect(merge);
          wetG.connect(merge);

          if (!(chain as any).__delay) {
            this.ensureMasterChain();
            if (this.masterChainInput) {
              merge.connect(this.masterChainInput);
            } else if (this.masterGain) {
              merge.connect(this.masterGain!);
            }
          }

          (chain as any).__reverb = rev;
          (chain as any).__reverbDry = dryG;
          (chain as any).__reverbWet = wetG;
        } else {
          // Update existing reverb
          (chain as any).__reverb.buffer = this.generateImpulseResponse(cfg.decay, cfg.predelay);
        }
        (chain as any).__reverbDry.gain.setValueAtTime(1 - cfg.mix, now);
        (chain as any).__reverbWet.gain.setValueAtTime(cfg.mix, now);
      }
    });

    // Apply master DISTORTION
    this.ensureMasterChain();
    const masterDistort = distortMods['master'] as DistortModule | undefined;
    if (masterDistort && this.masterDistortion && this.masterDistortDryGain && this.masterDistortWetGain) {
      this.masterDistortion.curve = this.makeDistortionCurve(masterDistort.amount);
      this.masterDistortion.oversample = '4x';
      this.masterDistortDryGain.gain.setValueAtTime(1 - masterDistort.mix, now);
      this.masterDistortWetGain.gain.setValueAtTime(masterDistort.mix, now);
    } else if (this.masterDistortDryGain && this.masterDistortWetGain) {
      // Reset: full dry
      this.masterDistortDryGain.gain.setValueAtTime(1, now);
      this.masterDistortWetGain.gain.setValueAtTime(0, now);
    }

    // Apply master DELAY
    const masterDelay = delayMods['master'] as DelayModule | undefined;
    if (masterDelay && this.masterDelay && this.masterDelayFeedback && this.masterDelayDryGain && this.masterDelayWetGain) {
      this.masterDelay.delayTime.setValueAtTime(masterDelay.time, now);
      this.masterDelayFeedback.gain.setValueAtTime(masterDelay.feedback, now);
      this.masterDelayDryGain.gain.setValueAtTime(1 - masterDelay.mix, now);
      this.masterDelayWetGain.gain.setValueAtTime(masterDelay.mix, now);
    } else if (this.masterDelayDryGain && this.masterDelayWetGain) {
      // Reset: full dry
      this.masterDelayDryGain.gain.setValueAtTime(1, now);
      this.masterDelayWetGain.gain.setValueAtTime(0, now);
    }

    // Apply master REVERB
    const masterReverb = reverbMods['master'] as ReverbModule | undefined;
    if (masterReverb && this.masterReverb && this.masterReverbDryGain && this.masterReverbWetGain) {
      this.masterReverb.buffer = this.generateImpulseResponse(masterReverb.decay, masterReverb.predelay);
      this.masterReverbDryGain.gain.setValueAtTime(1 - masterReverb.mix, now);
      this.masterReverbWetGain.gain.setValueAtTime(masterReverb.mix, now);
    } else if (this.masterReverbDryGain && this.masterReverbWetGain) {
      // Reset: full dry
      this.masterReverbDryGain.gain.setValueAtTime(1, now);
      this.masterReverbWetGain.gain.setValueAtTime(0, now);
    }

    // Apply master CHORUS
    const chorusMods = effectsConfig.chorusModules || {};
    const masterChorus = chorusMods['master'] as ChorusModule | undefined;
    if (masterChorus) {
      this.applyChorusEffect(masterChorus);
    }

    // Apply master PHASER
    const phaserMods = effectsConfig.phaserModules || {};
    const masterPhaser = phaserMods['master'] as PhaserModule | undefined;
    if (masterPhaser) {
      this.applyPhaserEffect(masterPhaser);
    }
  }

  /**
   * Apply chorus effect using modulated delay lines
   */
  private applyChorusEffect(cfg: ChorusModule): void {
    if (!this.audioContext) return;
    const ac = this.audioContext;
    const now = ac.currentTime;

    if (!(this as any).__chorusDelay) {
      const delay = ac.createDelay(0.1);
      delay.delayTime.setValueAtTime(0.02, now);
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.type = 'sine';
      lfo.connect(lfoGain);
      lfoGain.connect(delay.delayTime);
      lfo.start();

      const dryGain = ac.createGain();
      const wetGain = ac.createGain();
      const merge = ac.createGain();

      // Insert into master chain after reverb merge, before preGain
      if (this.masterReverbMerge && this.masterPreGain) {
        try { this.masterReverbMerge.disconnect(this.masterPreGain); } catch {}
        this.masterReverbMerge.connect(dryGain);
        this.masterReverbMerge.connect(delay);
        delay.connect(wetGain);
        dryGain.connect(merge);
        wetGain.connect(merge);
        merge.connect(this.masterPreGain);
      }

      (this as any).__chorusDelay = delay;
      (this as any).__chorusLFO = lfo;
      (this as any).__chorusLFOGain = lfoGain;
      (this as any).__chorusDry = dryGain;
      (this as any).__chorusWet = wetGain;
    }

    (this as any).__chorusLFO.frequency.setValueAtTime(cfg.rate, now);
    (this as any).__chorusLFOGain.gain.setValueAtTime(cfg.depth * 0.005, now); // depth controls delay modulation range
    (this as any).__chorusDry.gain.setValueAtTime(1 - cfg.mix, now);
    (this as any).__chorusWet.gain.setValueAtTime(cfg.mix, now);
  }

  /**
   * Apply phaser effect using allpass filters modulated by LFO
   */
  private applyPhaserEffect(cfg: PhaserModule): void {
    if (!this.audioContext) return;
    const ac = this.audioContext;
    const now = ac.currentTime;

    if (!(this as any).__phaserFilters) {
      const filters: BiquadFilterNode[] = [];
      for (let i = 0; i < cfg.stages; i++) {
        const f = ac.createBiquadFilter();
        f.type = 'allpass';
        f.frequency.setValueAtTime(1000, now);
        f.Q.setValueAtTime(0.5, now);
        filters.push(f);
      }

      // Chain allpass filters
      for (let i = 1; i < filters.length; i++) {
        filters[i - 1].connect(filters[i]);
      }

      const lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(cfg.rate, now);

      const lfoGain = ac.createGain();
      lfoGain.gain.setValueAtTime(cfg.depth * 2000, now);
      lfo.connect(lfoGain);

      // Connect LFO to all filter frequencies
      for (const f of filters) {
        lfoGain.connect(f.frequency);
      }
      lfo.start();

      const dryGain = ac.createGain();
      const wetGain = ac.createGain();
      const merge = ac.createGain();

      // Insert after chorus (or after reverb if no chorus)

      // For simplicity, insert before masterPreGain
      if (this.masterPreGain) {
        // Find what's currently connected to masterPreGain and re-route
        const inputNode = (this as any).__chorusDry
          ? (() => { return null; })()  // chorus already handles routing
          : this.masterReverbMerge;

        if (inputNode && inputNode !== null) {
          try { inputNode.disconnect(this.masterPreGain); } catch {}
          inputNode.connect(dryGain);
          inputNode.connect(filters[0]);
          filters[filters.length - 1].connect(wetGain);
          dryGain.connect(merge);
          wetGain.connect(merge);
          merge.connect(this.masterPreGain);
        }
      }

      (this as any).__phaserFilters = filters;
      (this as any).__phaserLFO = lfo;
      (this as any).__phaserLFOGain = lfoGain;
      (this as any).__phaserDry = dryGain;
      (this as any).__phaserWet = wetGain;
    }

    // Update existing phaser params
    (this as any).__phaserLFO.frequency.setValueAtTime(cfg.rate, now);
    (this as any).__phaserLFOGain.gain.setValueAtTime(cfg.depth * 2000, now);
    (this as any).__phaserDry.gain.setValueAtTime(1 - cfg.mix, now);
    (this as any).__phaserWet.gain.setValueAtTime(cfg.mix, now);
  }

  /**
   * Apply EQ update in real-time
   */
  private applyEQUpdate(eqConfig: any): void {
    console.log(`[Unified] EQ updated:`, eqConfig);
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    this.ensureMasterChain();

    // Master EQ
    const master = eqConfig?.['master'];
    if (master && this.masterEQLow && this.masterEQMid && this.masterEQHigh) {
      this.masterEQLow.gain.setValueAtTime(this.stepsToDb(master.low), now);
      this.masterEQMid.gain.setValueAtTime(this.stepsToDb(master.mid), now);
      this.masterEQHigh.gain.setValueAtTime(this.stepsToDb(master.high), now);
    } else if (this.masterEQLow && this.masterEQMid && this.masterEQHigh) {
      // Reset to neutral when not provided
      this.masterEQLow.gain.setValueAtTime(0, now);
      this.masterEQMid.gain.setValueAtTime(0, now);
      this.masterEQHigh.gain.setValueAtTime(0, now);
    }

    // Per-instrument EQ
    Object.keys(eqConfig || {}).forEach((name) => {
      const lower = name.toLowerCase();
      if (lower === 'master') return;
      const chain = this.ensureInstrumentChain(lower);
      const eq = eqConfig[name];
      if (chain && eq) {
        chain.eqLow.gain.setValueAtTime(this.stepsToDb(eq.low), now);
        chain.eqMid.gain.setValueAtTime(this.stepsToDb(eq.mid), now);
        chain.eqHigh.gain.setValueAtTime(this.stepsToDb(eq.high), now);
      }
    });
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

    // Clear existing scheduled events & cancel future sources; keep current audio playing
    this.clearScheduledEvents();
    this.cancelFutureScheduledAudio();

    // Immediately reschedule from current position with new tempo (no hard stop)
    this.schedulePattern();

    console.log(`[Unified] Timing adjusted - tempo ratio: ${tempoRatio.toFixed(3)}`);
  }

  /**
   * Apply real-time sequence change
   */
  private applyRealTimeSequenceChange(_oldPattern: ParsedPattern | null, _newPattern: ParsedPattern): void {
    if (!this.audioContext) return;

    console.log(`[Unified] Sequence adjusted for pattern change`);

    // Clear scheduled events & cancel future sources; let currently playing sounds finish
    this.clearScheduledEvents();
    this.cancelFutureScheduledAudio();

    // Immediately reschedule with new pattern (no hard stop)
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
      effectsEnabled: true,
      audioQuality: 'high',
      overflowMode: this.overflowMode
    };
  }

  /**
   * Real-time timing calculations (no pre-calculation)
   */
  private getStepInterval(): number {
    if (!this.currentPattern) return 0;
    const stepsPerBeat = AUDIO_CONSTANTS.STEPS_PER_BEAT; // e.g., 4 = 16th notes
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
   * Ensure master chain is created and connected:
   * EQLow -> EQMid -> EQHigh -> Comp -> Distortion(dry/wet) -> Delay(dry/wet) -> Reverb(dry/wet) -> PreGain -> MasterGain
   */
  private ensureMasterChain(): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.masterEQLow && this.masterEQMid && this.masterEQHigh && this.masterComp && this.masterPreGain && this.masterChainInput) {
      return; // already created
    }

    const ac = this.audioContext;
    // Create filters with neutral gains
    this.masterEQLow = ac.createBiquadFilter();
    this.masterEQLow.type = 'lowshelf';
    this.masterEQLow.frequency.setValueAtTime(150, ac.currentTime);
    this.masterEQLow.gain.setValueAtTime(0, ac.currentTime);

    this.masterEQMid = ac.createBiquadFilter();
    this.masterEQMid.type = 'peaking';
    this.masterEQMid.frequency.setValueAtTime(1000, ac.currentTime);
    this.masterEQMid.Q.setValueAtTime(1.0, ac.currentTime);
    this.masterEQMid.gain.setValueAtTime(0, ac.currentTime);

    this.masterEQHigh = ac.createBiquadFilter();
    this.masterEQHigh.type = 'highshelf';
    this.masterEQHigh.frequency.setValueAtTime(6000, ac.currentTime);
    this.masterEQHigh.gain.setValueAtTime(0, ac.currentTime);

    this.masterComp = ac.createDynamicsCompressor();
    this.masterComp.threshold.setValueAtTime(-24, ac.currentTime);
    this.masterComp.ratio.setValueAtTime(4, ac.currentTime);
    this.masterComp.attack.setValueAtTime(0.01, ac.currentTime);
    this.masterComp.release.setValueAtTime(0.25, ac.currentTime);
    this.masterComp.knee.setValueAtTime(30, ac.currentTime);

    // Distortion with dry/wet mix (defaults to full dry = passthrough)
    this.masterDistortion = ac.createWaveShaper();
    this.masterDistortion.oversample = '4x';
    this.masterDistortDryGain = ac.createGain();
    this.masterDistortDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterDistortWetGain = ac.createGain();
    this.masterDistortWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterDistortMerge = ac.createGain();

    // Delay with feedback and dry/wet mix (defaults to full dry = passthrough)
    this.masterDelay = ac.createDelay(2.0);
    this.masterDelay.delayTime.setValueAtTime(0.25, ac.currentTime);
    this.masterDelayFeedback = ac.createGain();
    this.masterDelayFeedback.gain.setValueAtTime(0, ac.currentTime);
    this.masterDelayDryGain = ac.createGain();
    this.masterDelayDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterDelayWetGain = ac.createGain();
    this.masterDelayWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterDelayMerge = ac.createGain();

    // Reverb with dry/wet mix (defaults to full dry = passthrough)
    this.masterReverb = ac.createConvolver();
    // Generate a default short impulse response
    this.masterReverb.buffer = this.generateImpulseResponse(1.0, 0.01);
    this.masterReverbDryGain = ac.createGain();
    this.masterReverbDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterReverbWetGain = ac.createGain();
    this.masterReverbWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterReverbMerge = ac.createGain();

    this.masterPreGain = ac.createGain();
    this.masterPreGain.gain.setValueAtTime(1, ac.currentTime);

    // Connect chain: EQLow -> EQMid -> EQHigh -> Comp -> Distortion(dry/wet) -> Delay(dry/wet) -> Reverb(dry/wet) -> PreGain -> MasterGain
    this.masterEQLow.connect(this.masterEQMid);
    this.masterEQMid.connect(this.masterEQHigh);
    this.masterEQHigh.connect(this.masterComp);

    // Comp -> Distortion dry/wet
    this.masterComp.connect(this.masterDistortDryGain);
    this.masterComp.connect(this.masterDistortion);
    this.masterDistortion.connect(this.masterDistortWetGain);
    this.masterDistortDryGain.connect(this.masterDistortMerge);
    this.masterDistortWetGain.connect(this.masterDistortMerge);

    // Distortion merge -> Delay dry/wet
    this.masterDistortMerge.connect(this.masterDelayDryGain);
    this.masterDistortMerge.connect(this.masterDelay);
    this.masterDelay.connect(this.masterDelayFeedback);
    this.masterDelayFeedback.connect(this.masterDelay); // feedback loop
    this.masterDelay.connect(this.masterDelayWetGain);
    this.masterDelayDryGain.connect(this.masterDelayMerge);
    this.masterDelayWetGain.connect(this.masterDelayMerge);

    // Delay merge -> Reverb dry/wet
    this.masterDelayMerge.connect(this.masterReverbDryGain);
    this.masterDelayMerge.connect(this.masterReverb);
    this.masterReverb.connect(this.masterReverbWetGain);
    this.masterReverbDryGain.connect(this.masterReverbMerge);
    this.masterReverbWetGain.connect(this.masterReverbMerge);

    // Reverb merge -> PreGain -> MasterGain
    this.masterReverbMerge.connect(this.masterPreGain);
    this.masterPreGain.connect(this.masterGain);

    this.masterChainInput = this.masterEQLow;
  }

  /**
   * Preload a small built-in sample bank.
   * For MVP these are generated procedurally to avoid external assets.
   * Names: 'kick', 'snare', 'hihat', 'clap'
   */
  private async preloadDefaultSamples(): Promise<void> {
    if (!this.audioContext) return;
    const ac = this.audioContext;
    const add = (name: string, buf: AudioBuffer) => this.sampleBuffers.set(name.toLowerCase(), buf);
    try {
      add('kick', this.generateKickSample(ac));
      add('snare', this.generateSnareSample(ac));
      add('hihat', this.generateHiHatSample(ac));
      add('clap', this.generateClapSample(ac));
      add('kick808', this.generateKick808Sample(ac));
      add('rim', this.generateRimSample(ac));
      add('tom', this.generateTomSample(ac));
      add('cowbell', this.generateCowbellSample(ac));
      add('shaker', this.generateShakerSample(ac));
      add('crash', this.generateCrashSample(ac));
      add('openhat', this.generateOpenHatSample(ac));
      add('perc', this.generatePercSample(ac));
    } catch (e) {
      console.warn('Failed to generate default samples:', e);
    }
  }

  // Procedural sample generators (very light approximations)
  private generateKickSample(ac: AudioContext): AudioBuffer {
    const duration = 0.2;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    // Exponential pitch down with exponential amplitude decay
    const startFreq = 120;
    const endFreq = 40;
    const twoPi = 2 * Math.PI;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      const env = Math.pow(1 - t, 4);
      phase += twoPi * freq / sr;
      ch[i] = Math.sin(phase) * env * 0.9;
    }
    return buf;
  }

  private generateSnareSample(ac: AudioContext): AudioBuffer {
    const duration = 0.15;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 8);
      ch[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
    return buf;
  }

  private generateHiHatSample(ac: AudioContext): AudioBuffer {
    const duration = 0.07;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    // Bright, short noise burst
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 10);
      const n = (Math.random() * 2 - 1);
      ch[i] = n * env * 0.35;
    }
    return buf;
  }

  private generateClapSample(ac: AudioContext): AudioBuffer {
    // Multi-tap noise bursts to approximate a clap
    const duration = 0.2;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const taps = [0, 0.015, 0.03, 0.045];
    for (let i = 0; i < len; i++) ch[i] = 0;
    for (const tTap of taps) {
      const start = Math.floor(tTap * sr);
      for (let i = 0; i < len - start; i++) {
        const t = i / (len - start);
        const env = Math.pow(1 - t, 10);
        ch[start + i] += (Math.random() * 2 - 1) * env * 0.18;
      }
    }
    // Normalize a bit to avoid clipping
    let max = 0;
    for (let i = 0; i < len; i++) max = Math.max(max, Math.abs(ch[i]));
    if (max > 1e-6) {
      const s = 0.95 / max;
      for (let i = 0; i < len; i++) ch[i] *= s;
    }
    return buf;
  }

  private generateKick808Sample(ac: AudioContext): AudioBuffer {
    // Deeper, longer 808-style kick with sub-bass emphasis
    const duration = 0.5;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const startFreq = 60;
    const endFreq = 30;
    const twoPi = 2 * Math.PI;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      const env = Math.pow(1 - t, 2); // slower decay than regular kick
      phase += twoPi * freq / sr;
      ch[i] = Math.sin(phase) * env * 0.95;
    }
    return buf;
  }

  private generateRimSample(ac: AudioContext): AudioBuffer {
    // Short bandpass-filtered noise with a tonal click
    const duration = 0.04;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const twoPi = 2 * Math.PI;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 15);
      // Mix tonal click (1200Hz) with noise
      const tone = Math.sin(twoPi * 1200 * i / sr) * 0.6;
      const noise = (Math.random() * 2 - 1) * 0.4;
      ch[i] = (tone + noise) * env * 0.7;
    }
    return buf;
  }

  private generateTomSample(ac: AudioContext): AudioBuffer {
    // Mid-frequency sine sweep with longer body
    const duration = 0.3;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const startFreq = 200;
    const endFreq = 80;
    const twoPi = 2 * Math.PI;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      const env = Math.pow(1 - t, 3);
      phase += twoPi * freq / sr;
      ch[i] = Math.sin(phase) * env * 0.8;
    }
    return buf;
  }

  private generateCowbellSample(ac: AudioContext): AudioBuffer {
    // Two detuned square-ish tones for metallic character
    const duration = 0.15;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const twoPi = 2 * Math.PI;
    const f1 = 545;
    const f2 = 810;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 5);
      const s1 = Math.sign(Math.sin(twoPi * f1 * i / sr)) * 0.3;
      const s2 = Math.sign(Math.sin(twoPi * f2 * i / sr)) * 0.3;
      ch[i] = (s1 + s2) * env * 0.5;
    }
    return buf;
  }

  private generateShakerSample(ac: AudioContext): AudioBuffer {
    // Very short high-pass noise burst
    const duration = 0.05;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 12);
      const noise = Math.random() * 2 - 1;
      // Simple one-pole high-pass
      const hp = noise - prev;
      prev = noise;
      ch[i] = hp * env * 0.3;
    }
    return buf;
  }

  private generateCrashSample(ac: AudioContext): AudioBuffer {
    // Long noise burst with slow decay
    const duration = 1.2;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 1.5);
      ch[i] = (Math.random() * 2 - 1) * env * 0.25;
    }
    return buf;
  }

  private generateOpenHatSample(ac: AudioContext): AudioBuffer {
    // Longer hi-hat with sustained noise
    const duration = 0.25;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 3);
      const noise = Math.random() * 2 - 1;
      // High-pass for brightness
      const hp = noise - prev * 0.85;
      prev = noise;
      ch[i] = hp * env * 0.3;
    }
    return buf;
  }

  private generatePercSample(ac: AudioContext): AudioBuffer {
    // Metallic, inharmonic ring — multiple detuned sine partials
    const duration = 0.35;
    const sr = ac.sampleRate;
    const len = Math.floor(duration * sr);
    const buf = ac.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    const twoPi = 2 * Math.PI;
    const freqs = [340, 553, 788, 1024]; // inharmonic
    const amps = [0.4, 0.3, 0.2, 0.1];
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 4);
      let sample = 0;
      for (let f = 0; f < freqs.length; f++) {
        sample += Math.sin(twoPi * freqs[f] * i / sr) * amps[f];
      }
      ch[i] = sample * env * 0.6;
    }
    return buf;
  }

  /**
   * Ensure per-instrument chain exists and is connected to master chain input
   * Chain: preGain -> filter -> comp -> eqLow -> eqMid -> eqHigh -> pan -> masterChainInput
   */
  private ensureInstrumentChain(name: string) {
    if (!this.audioContext) return null;
    const n = name.toLowerCase();
    const existing = this.instrumentChains.get(n);
    if (existing) return existing;

    const ac = this.audioContext;
    const preGain = ac.createGain();
    preGain.gain.setValueAtTime(1, ac.currentTime);

    // Filter defaults to lowpass at 20000Hz (passthrough)
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(20000, ac.currentTime);
    filter.Q.setValueAtTime(1, ac.currentTime);

    const comp = ac.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-24, ac.currentTime);
    comp.ratio.setValueAtTime(4, ac.currentTime);
    comp.attack.setValueAtTime(0.01, ac.currentTime);
    comp.release.setValueAtTime(0.25, ac.currentTime);
    comp.knee.setValueAtTime(30, ac.currentTime);

    const eqLow = ac.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.setValueAtTime(150, ac.currentTime);
    eqLow.gain.setValueAtTime(0, ac.currentTime);

    const eqMid = ac.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.setValueAtTime(1000, ac.currentTime);
    eqMid.Q.setValueAtTime(1.0, ac.currentTime);
    eqMid.gain.setValueAtTime(0, ac.currentTime);

    const eqHigh = ac.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.setValueAtTime(6000, ac.currentTime);
    eqHigh.gain.setValueAtTime(0, ac.currentTime);

    // Pan defaults to center (0)
    const pan = ac.createStereoPanner();
    pan.pan.setValueAtTime(0, ac.currentTime);

    // Connect chain: preGain -> filter -> comp -> eqLow -> eqMid -> eqHigh -> pan -> masterChainInput
    preGain.connect(filter);
    filter.connect(comp);
    comp.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(pan);

    // Ensure master input
    this.ensureMasterChain();
    if (this.masterChainInput) {
      pan.connect(this.masterChainInput);
    } else if (this.masterGain) {
      pan.connect(this.masterGain);
    }

    const chain = { preGain, filter, comp, eqLow, eqMid, eqHigh, pan, input: preGain, output: pan };
    this.instrumentChains.set(n, chain);
    return chain;
  }

  private stepsToDb(steps: number): number {
    const s = Math.max(-3, Math.min(3, steps | 0));
    return s * 3; // +/- 9 dB range
  }

  private stepsToLinear(steps: number): number {
    const db = this.stepsToDb(steps);
    return Math.pow(10, db / 20);
  }

  /**
   * Resolve an LFO target to the correct AudioParam and depth scaling factor.
   */
  private resolveLFOTarget(lfoCfg: LFOModule): { param: AudioParam; depthScale: number } | null {
    const targetType = lfoCfg.target;

    if (lfoCfg.scope === 'master') {
      this.ensureMasterChain();
      switch (targetType) {
        case 'amp':
          return this.masterPreGain ? { param: this.masterPreGain.gain, depthScale: this.masterPreGain.gain.value } : null;
        case 'delay.time':
          return this.masterDelay ? { param: this.masterDelay.delayTime, depthScale: this.masterDelay.delayTime.value * 0.1 } : null;
        case 'delay.feedback':
          return this.masterDelayFeedback ? { param: this.masterDelayFeedback.gain, depthScale: this.masterDelayFeedback.gain.value } : null;
        default:
          return null;
      }
    } else {
      const chain = this.ensureInstrumentChain(lfoCfg.name.toLowerCase());
      if (!chain) return null;
      switch (targetType) {
        case 'amp':
          return { param: chain.preGain.gain, depthScale: chain.preGain.gain.value };
        case 'filter.freq':
          return { param: chain.filter.frequency, depthScale: chain.filter.frequency.value };
        case 'filter.q':
          return { param: chain.filter.Q, depthScale: chain.filter.Q.value };
        case 'pan':
          return { param: chain.pan.pan, depthScale: 1 };
        default:
          return null;
      }
    }
  }

  /**
   * Create or update an LFO for any supported target parameter
   */
  private updateLFO(lfoCfg: LFOModule): void {
    if (!this.audioContext) return;
    const ac = this.audioContext;
    const now = ac.currentTime;
    const key = lfoCfg.key.toLowerCase();

    // Resolve the target AudioParam
    const resolved = this.resolveLFOTarget(lfoCfg);
    if (!resolved) return;
    const { param: targetParam, depthScale } = resolved;

    let entry = this.lfoMap.get(key);
    if (!entry) {
      const osc = ac.createOscillator();
      const depthGain = ac.createGain();
      osc.connect(depthGain);
      depthGain.connect(targetParam);
      osc.start();
      entry = {
        osc,
        depthGain,
        targetParam,
        scope: lfoCfg.scope,
        name: lfoCfg.name.toLowerCase(),
        wave: lfoCfg.wave,
        rateHz: lfoCfg.rateHz,
        depth: lfoCfg.depth,
      };
      this.lfoMap.set(key, entry);
    }

    // Update target if changed
    if (entry.targetParam !== targetParam) {
      try { entry.depthGain.disconnect(); } catch {}
      entry.depthGain.connect(targetParam);
      entry.targetParam = targetParam;
    }

    // Update oscillator params
    entry.osc.type = lfoCfg.wave;
    entry.osc.frequency.setValueAtTime(lfoCfg.rateHz, now);
    entry.depth = lfoCfg.depth;

    // Scale depth using resolved depth scaling
    entry.depthGain.gain.setValueAtTime(depthScale * lfoCfg.depth, now);
  }

  private disposeLFO(key: string): void {
    const entry = this.lfoMap.get(key);
    if (!entry) return;
    try { entry.osc.stop(); } catch {}
    try { entry.osc.disconnect(); } catch {}
    try { entry.depthGain.disconnect(); } catch {}
    this.lfoMap.delete(key);
  }

  /**
   * Generate an impulse response for convolution reverb
   */
  private generateImpulseResponse(decay: number, predelay: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = Math.floor(sampleRate * decay);
    const buffer = this.audioContext!.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      const predelaySamples = Math.floor(predelay * sampleRate);
      for (let i = predelaySamples; i < length; i++) {
        const t = (i - predelaySamples) / (length - predelaySamples);
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
      }
    }
    return buffer;
  }

  /**
   * Generate a waveshaper distortion transfer curve
   */
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(new ArrayBuffer(samples * 4));
    const k = amount * 100;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

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

    // Schedule loops starting from the current loop (always schedule the current loop)
    for (let loop = currentLoop; loop < currentLoop + loopsToSchedule; loop++) {
      const loopStartTime = this.startTime + (loop * loopDuration);
      console.log(`[${timestamp}] Scheduling loop ${loop} at time ${loopStartTime.toFixed(3)}`);

      if (loop === currentLoop) {
        console.log(`[Groove-Debug] currentPattern.grooveModules:`, JSON.stringify(this.currentPattern?.grooveModules));
      }

      // Determine which steps to schedule in this loop
      let startStep = 0;
      const endStep = totalSteps;

      // If this is the current loop, start from the current step
      if (loop === currentLoop) {
        const timeInCurrentLoop = currentTime - loopStartTime;
        const actualCurrentStep = Math.floor(timeInCurrentLoop / stepInterval);
        startStep = Math.max(0, actualCurrentStep);
        console.log(`[${timestamp}] Current loop ${loop}, time in loop: ${timeInCurrentLoop.toFixed(3)}s, starting from step ${startStep}`);
      }

      // Schedule steps in this loop
      for (let step = startStep; step < endStep; step++) {
        const baseStepTime = loopStartTime + (step * stepInterval);

        // Check each instrument for hits at this step
        Object.entries(this.currentPattern.instruments).forEach(([instrumentName, instrumentData]) => {
          if (instrumentData.steps.length === 0) return;

          let isHit = false;
          let velocity = 0.7;

          // Determine hit and velocity based on overflow mode
          if (this.overflowMode === 'loop') {
            const patternStep = step % instrumentData.steps.length;
            isHit = instrumentData.steps[patternStep] === true;
            velocity = (instrumentData as any).velocities?.[patternStep] ?? 0.7;
          } else {
            if (step < instrumentData.steps.length) {
              isHit = instrumentData.steps[step] === true;
              velocity = (instrumentData as any).velocities?.[step] ?? 0.7;
            } else {
              isHit = false;
            }
          }

          if (isHit) {
            const isOddStep = step % 2 === 1;

            // Apply Groove/Swing
            // Check for instrument-specific groove, fallback to master
            const groove = this.currentPattern?.grooveModules?.[instrumentName.toLowerCase()] ||
                           this.currentPattern?.grooveModules?.['master'];

            let grooveOffset = 0;
            if (groove) {
                const amount = groove.amount; // 0..1
                if (groove.type === 'swing') {
                    if (isOddStep) {
                        grooveOffset = amount * stepInterval * 0.33;
                    }
                } else if (groove.type === 'humanize') {
                    grooveOffset = (Math.random() - 0.5) * amount * 0.05;
                } else if (groove.type === 'rush') {
                    grooveOffset = -amount * 0.03;
                } else if (groove.type === 'drag') {
                    grooveOffset = amount * 0.03;
                }
            }

            if (isHit) {
              console.log(`[Hit] ${instrumentName} at step ${step} (${isOddStep ? 'ODD' : 'EVEN'}). Offset: ${grooveOffset.toFixed(4)}s`);
            }

            const stepTime = baseStepTime + grooveOffset;

            // Only schedule if the step time with groove is in the future
            if (stepTime >= currentTime) {
              // console.log(`[${timestamp}] Scheduling ${instrumentName} hit at step ${step}, time ${stepTime.toFixed(3)}, vel ${velocity}`);
              (this as any).__currentVelocity = velocity;
              this.scheduleInstrumentHit(instrumentName, stepTime);
              (this as any).__currentVelocity = undefined;
            }
          }
        });
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

    const envelope = this.audioContext.createGain();
    const lowerName = instrumentName.toLowerCase();
    // Determine velocity for this hit (default 0.7 = normal)
    const velocity = (this as any).__currentVelocity ?? 0.7;
    const hasInstrumentEffects = !!(
      this.currentPattern?.eqModules?.[lowerName] ||
      this.currentPattern?.ampModules?.[lowerName] ||
      this.currentPattern?.compModules?.[lowerName] ||
      this.currentPattern?.filterModules?.[lowerName] ||
      this.currentPattern?.panModules?.[lowerName]
    );
    const targetChain = hasInstrumentEffects ? this.ensureInstrumentChain(lowerName) : null;
    if (targetChain) {
      envelope.connect(targetChain.input);
    } else if (this.masterChainInput) {
      envelope.connect(this.masterChainInput);
    } else {
      // Fallback
      envelope.connect(this.masterGain);
    }

    // Prefer sample playback when available (explicit mapping or matching name)
    const mappedSampleName = this.currentPattern?.sampleModules?.[lowerName]?.sample || lowerName;
    const sampleBuffer = this.sampleBuffers.get(mappedSampleName);
    let scheduledOsc: OscillatorNode | null = null;
    let scheduledNoise: AudioBufferSourceNode | null = null;

    if (sampleBuffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = sampleBuffer;
      source.connect(envelope);
      const gainSteps = this.currentPattern?.sampleModules?.[lowerName]?.gain ?? 0;
      const baseGain = this.stepsToLinear(gainSteps) * velocity;
      const envCfg = this.currentPattern?.envelopeModules?.[lowerName];
      if (envCfg) {
        // ADSR envelope
        const peakGain = baseGain;
        const sustainGain = peakGain * envCfg.sustain;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(peakGain, time + envCfg.attack);
        envelope.gain.linearRampToValueAtTime(sustainGain, time + envCfg.attack + envCfg.decay);
        // Hold sustain, then release
        const holdEnd = time + Math.max(sampleBuffer.duration, envCfg.attack + envCfg.decay + 0.05);
        envelope.gain.setValueAtTime(sustainGain, holdEnd);
        envelope.gain.linearRampToValueAtTime(0.001, holdEnd + envCfg.release);
        source.start(time);
        source.stop(holdEnd + envCfg.release + 0.01);
      } else {
        envelope.gain.setValueAtTime(baseGain, time);
        source.start(time);
        source.stop(time + Math.min(sampleBuffer.duration + 0.01, 1.5));
      }
      // Track and schedule
      this.activeNoiseSources.push(source);
      scheduledNoise = source;
    } else {
      // Fall back to synthesized sounds
      const oscillator = this.audioContext.createOscillator();
      scheduledOsc = oscillator;
      oscillator.connect(envelope);
      // Track for immediate stopping
      this.activeOscillators.push(oscillator);

      switch (lowerName) {
        case 'kick': {
          const noteFreq = this.currentPattern?.noteModules?.[lowerName]?.pitch ?? 60;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(noteFreq, time);
          oscillator.frequency.exponentialRampToValueAtTime(noteFreq * 0.5, time + 0.1);
          const envK = this.currentPattern?.envelopeModules?.[lowerName];
          if (envK) {
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(0.8 * velocity, time + envK.attack);
            envelope.gain.linearRampToValueAtTime(0.8 * velocity * envK.sustain, time + envK.attack + envK.decay);
            const endK = time + envK.attack + envK.decay + 0.05;
            envelope.gain.setValueAtTime(0.8 * velocity * envK.sustain, endK);
            envelope.gain.linearRampToValueAtTime(0.001, endK + envK.release);
            oscillator.start(time);
            oscillator.stop(endK + envK.release + 0.01);
          } else {
            envelope.gain.setValueAtTime(0.8 * velocity, time);
            envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            oscillator.start(time);
            oscillator.stop(time + 0.2);
          }
          break;
        }
        case 'snare': {
          // Quick noise burst
          const bufferSize = this.audioContext.sampleRate * 0.1;
          const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
          const output = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
          const noise = this.audioContext.createBufferSource();
          noise.buffer = buffer;
          noise.connect(envelope);
          this.activeNoiseSources.push(noise);
          scheduledNoise = noise;
          const envS = this.currentPattern?.envelopeModules?.[lowerName];
          if (envS) {
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(0.3 * velocity, time + envS.attack);
            envelope.gain.linearRampToValueAtTime(0.3 * velocity * envS.sustain, time + envS.attack + envS.decay);
            const endS = time + envS.attack + envS.decay + 0.02;
            envelope.gain.setValueAtTime(0.3 * velocity * envS.sustain, endS);
            envelope.gain.linearRampToValueAtTime(0.001, endS + envS.release);
            noise.start(time);
            noise.stop(endS + envS.release + 0.01);
          } else {
            envelope.gain.setValueAtTime(0.3 * velocity, time);
            envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            noise.start(time);
            noise.stop(time + 0.1);
          }
          break;
        }
        case 'hihat': {
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(8000, time);
          const envH = this.currentPattern?.envelopeModules?.[lowerName];
          if (envH) {
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(0.1 * velocity, time + envH.attack);
            envelope.gain.linearRampToValueAtTime(0.1 * velocity * envH.sustain, time + envH.attack + envH.decay);
            const endH = time + envH.attack + envH.decay + 0.02;
            envelope.gain.linearRampToValueAtTime(0.001, endH + envH.release);
            oscillator.start(time);
            oscillator.stop(endH + envH.release + 0.01);
          } else {
            envelope.gain.setValueAtTime(0.1 * velocity, time);
            envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            oscillator.start(time);
            oscillator.stop(time + 0.05);
          }
          break;
        }
        default: {
          const noteFreqDef = this.currentPattern?.noteModules?.[lowerName]?.pitch ?? 440;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(noteFreqDef, time);
          const envD = this.currentPattern?.envelopeModules?.[lowerName];
          if (envD) {
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(0.3 * velocity, time + envD.attack);
            envelope.gain.linearRampToValueAtTime(0.3 * velocity * envD.sustain, time + envD.attack + envD.decay);
            const endD = time + envD.attack + envD.decay + 0.05;
            envelope.gain.setValueAtTime(0.3 * velocity * envD.sustain, endD);
            envelope.gain.linearRampToValueAtTime(0.001, endD + envD.release);
            oscillator.start(time);
            oscillator.stop(endD + envD.release + 0.01);
          } else {
            envelope.gain.setValueAtTime(0.3 * velocity, time);
            envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            oscillator.start(time);
            oscillator.stop(time + 0.1);
          }
          break;
        }
      }
    }

    // Track scheduled sources so we can cancel future events on live edits
    const now = this.audioContext.currentTime;
    const cleanupFns: Array<() => void> = [];
    if (scheduledOsc) {
      const osc = scheduledOsc;
      cleanupFns.push(() => {
        try { osc.stop(now); } catch (e) { /* ignore */ }
        try { osc.disconnect(); } catch (e) { /* ignore */ }
        try { envelope.disconnect(); } catch (e) { /* ignore */ }
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
      });
    } else {
      cleanupFns.push(() => {
        try { envelope.disconnect(); } catch (e) { /* ignore */ }
      });
    }
    if (scheduledNoise) {
      cleanupFns.push(() => {
        try { scheduledNoise!.stop(now); } catch (e) { /* ignore */ }
        try { scheduledNoise!.disconnect(); } catch (e) { /* ignore */ }
        this.activeNoiseSources = this.activeNoiseSources.filter(src => src !== scheduledNoise);
      });
    }
    const scheduled = { startTime: time, instrument: lowerName, stop: () => cleanupFns.forEach(fn => fn()) };
    this.pendingSources.push(scheduled);

    // Auto-prune this scheduled entry shortly after it should have started
    const delayMs = Math.max(0, (time - now + 0.5) * 1000);
    const pruneId = window.setTimeout(() => {
      this.pendingSources = this.pendingSources.filter(s => s !== scheduled);
    }, delayMs);
    this.scheduledEvents.push(pruneId);

    // Auto-cleanup when audio ends
    if (scheduledOsc && typeof scheduledOsc.addEventListener === 'function') {
      const cleanup = () => {
        this.activeOscillators = this.activeOscillators.filter(osc => osc !== scheduledOsc);
      };
      scheduledOsc.addEventListener('ended', cleanup);
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

    // Cancel any sources scheduled for the future
    this.cancelFutureScheduledAudio();
  }

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(id => clearTimeout(id));
    this.scheduledEvents = [];
  }

  /**
   * Cancel any audio sources that are scheduled to start in the future.
   * Keeps currently playing sounds to avoid audible gaps during live edits.
   */
  private cancelFutureScheduledAudio(): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime - 0.002; // small epsilon
    const remaining: typeof this.pendingSources = [];
    for (const s of this.pendingSources) {
      if (s.startTime >= now) {
        try { s.stop(); } catch { /* ignore */ }
      } else {
        remaining.push(s);
      }
    }
    this.pendingSources = remaining;
  }

  /**
   * Get parameter history for debugging
   */
  getParameterHistory(): ParameterUpdate[] {
    return [...this.parameterHistory];
  }

  /**
   * Set scheduling overflow mode ('loop' | 'rest')
   * When changed during playback, reschedules to apply immediately.
   */
  setOverflowMode(mode: 'loop' | 'rest'): void {
    if (this.overflowMode === mode) return;
    this.overflowMode = mode;
    if (this.isPlaying && this.audioContext) {
      this.clearScheduledEvents();
      this.stopAllAudio();
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      }
      this.schedulePattern();
    }
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
