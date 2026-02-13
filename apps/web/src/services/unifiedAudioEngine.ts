// Unified Audio Engine - Real-time everything, no pre-calculation
import { ParsedPattern, UnifiedAudioState, LFOModule, FilterModule, DelayModule, ReverbModule, PanModule, DistortModule, ChorusModule, PhaserModule } from '../types/app';
import { PatternParser } from './patternParser';
import { applyGrooveTemplate, getGrooveTemplate } from './groovePresets';
import * as Tone from 'tone';

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
  private tonePart: Tone.Part | null = null;

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

  // Dynamic master effects (chorus, distortion, phaser — created on first use)
  private chorusDelay: DelayNode | null = null;
  private chorusLFO: OscillatorNode | null = null;
  private chorusLFOGain: GainNode | null = null;
  private chorusDryGain: GainNode | null = null;
  private chorusWetGain: GainNode | null = null;
  private chorusMerge: GainNode | null = null;

  private distortionNode: WaveShaperNode | null = null;
  private distortionDryGain: GainNode | null = null;
  private distortionWetGain: GainNode | null = null;
  private distortionMerge: GainNode | null = null;

  private phaserFilters: BiquadFilterNode[] | null = null;
  private phaserLFO: OscillatorNode | null = null;
  private phaserLFOGain: GainNode | null = null;
  private phaserDryGain: GainNode | null = null;
  private phaserWetGain: GainNode | null = null;
  private phaserMerge: GainNode | null = null;

  // Current velocity for the hit being scheduled (set by Tone.Part callback)
  private currentVelocity: number = 0.7;

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

  // No longer using custom timing system, powered by Tone.Transport

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

      // Use Tone.js context as our source of truth
      this.audioContext = Tone.context.rawContext as AudioContext;

      // Create audio graph using the shared context
      this.masterGain = Tone.context.createGain();
      this.masterGain.gain.value = 1.0;

      this.volumeGain = Tone.context.createGain();
      this.volumeGain.gain.value = 0.5; // Start at -6dB equivalent

      // Ensure master chain
      this.ensureMasterChain();

      // Connect: masterGain -> volumeGain -> destination
      this.masterGain.connect(this.volumeGain);
      this.volumeGain.connect(this.audioContext.destination);

      // Preload a minimal sample bank (procedurally generated for MVP)
      await this.preloadDefaultSamples();

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

      console.log(`[Unified] Pattern loaded: ${Object.keys(this.currentPattern.instruments).length} instruments, ${this.currentPattern.tempo} BPM`);
    } catch (error) {
      console.error('Failed to load pattern:', error);
      throw new Error('Failed to load pattern');
    }
  }

  /**
   * Play the pattern
   */
  async play(): Promise<void> {
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
      // CRITICAL: Tone.start() must be the very first await to preserve the user gesture.
      // It handles resuming the AudioContext.
      await Tone.start();

      if (Tone.context.state !== 'running') {
        console.warn('[Audio] Warning: Tone.context is still NOT running after Tone.start()');
      }

      // Sync local context reference just in case it was swapped
      this.audioContext = Tone.context.rawContext as AudioContext;

      // Clear any existing scheduled events
      this.clearScheduledEvents();
      this.stopAllAudio();

      // Restore master gain (stopAllAudio sets it to 0 for instant mute)
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      }

      // Sync Tone Transport BPM
      Tone.Transport.bpm.value = this.currentPattern.tempo;

      // Ensure Tone.Part is up to date
      this.rebuildTonePart();

      // Start transport
      if (this.isPaused) {
        Tone.Transport.start();
        this.isPaused = false;
      } else {
        Tone.Transport.position = 0;
        Tone.Transport.start();
      }

      this.isPlaying = true;
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

    Tone.Transport.pause();

    // Stop all active non-Tone audio immediately
    this.stopAllAudio();

    this.isPlaying = false;
    this.isPaused = true;

    console.log(`Paused via Tone.Transport at: ${Tone.Transport.position}`);
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    // Stop all audio immediately
    this.stopAllAudio();

    // Clear scheduling
    this.scheduledEvents.forEach(id => window.clearTimeout(id));
    this.scheduledEvents = [];

    // Restore master gain
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    }

    this.isPlaying = false;
    this.isPaused = false;

    console.log('Stopped and reset via Tone.Transport');
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

    // Debug: console.log(`[Unified] Updating ${type}:`, value);

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
        // Apply master effects that are handled by dedicated functions
        if (value.chorus && value.chorus['master']) this.applyChorusEffect(value.chorus['master']);
        if (value.phaser && value.phaser['master']) this.applyPhaserEffect(value.phaser['master']);
        if (value.distort && value.distort['master']) this.applyDistortionEffect(value.distort['master']);
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

    // Debug: console.log(`[Unified] Tempo change: ${oldTempo} -> ${newTempo} BPM`);

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

    // Debug: console.log(`[Unified] Sequence updated - ${Object.keys(newPattern.instruments).length} instruments`);

    // Apply real-time sequence change if currently playing
    if (this.isPlaying && this.audioContext) {
      this.applyRealTimeSequenceChange(oldPattern, newPattern);
    }
  }

  /**
   * Apply effects update in real-time
   */
  private applyEffectsUpdate(effectsConfig: any): void {
    // Debug: console.log(`[Unified] Effects updated:`, effectsConfig);
    if (!Tone.context) return;

    const ac = Tone.context.rawContext as AudioContext;
    const now = ac.currentTime;
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
    Object.entries(this.currentPattern!.instruments).forEach(([name]) => {
      const lowerName = name.toLowerCase();
      const cfg = this.currentPattern?.delayModules?.[lowerName];
      const chain = this.instrumentChains.get(lowerName);

      if (chain && cfg) {
        if (!(chain as any).__delay) {
          const dly = ac.createDelay(2.0);
          const fb = ac.createGain();
          const dryG = ac.createGain();
          const wetG = ac.createGain();
          const merge = ac.createGain();

          // Chain: preGain -> filter -> comp -> eqLow -> eqMid -> eqHigh -> [Delay] -> pan
          try { chain.eqHigh.disconnect(chain.pan); } catch {}
          chain.eqHigh.connect(dryG);
          chain.eqHigh.connect(dly);
          dly.connect(fb);
          fb.connect(dly);
          dly.connect(wetG);
          dryG.connect(merge);
          wetG.connect(merge);
          merge.connect(chain.pan);

          (chain as any).__delay = dly;
          (chain as any).__delayFeedback = fb;
          (chain as any).__delayDry = dryG;
          (chain as any).__delayWet = wetG;
        }
        (chain as any).__delay.delayTime.setValueAtTime(cfg.time, now);
        (chain as any).__delayFeedback.gain.setValueAtTime(cfg.feedback, now);
        (chain as any).__delayDry.gain.setValueAtTime(1 - cfg.mix, now);
        (chain as any).__delayWet.gain.setValueAtTime(cfg.mix, now);
      }
    });

    Object.entries(this.currentPattern!.instruments).forEach(([name]) => {
      const lowerName = name.toLowerCase();
      const cfg = this.currentPattern?.reverbModules?.[lowerName];
      const chain = this.instrumentChains.get(lowerName);

      if (chain && cfg) {
        if (!(chain as any).__reverb) {
          const rev = ac.createConvolver();
          rev.buffer = this.generateImpulseResponse(cfg.decay, cfg.predelay);
          const dryG = ac.createGain();
          const wetG = ac.createGain();
          const merge = ac.createGain();


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
      this.masterDistortion.curve = this.makeDistortionCurve(masterDistort.amount) as any;
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
    const chorusMods = effectsConfig.chorus || {};
    const masterChorus = chorusMods['master'] as ChorusModule | undefined;
    if (masterChorus) {
      this.applyChorusEffect(masterChorus);
    }

    // Apply master PHASER
    const phaserMods = effectsConfig.phaser || {};
    const masterPhaser = phaserMods['master'] as PhaserModule | undefined;
    if (masterPhaser) {
      this.applyPhaserEffect(masterPhaser);
    }
  }

  /**
   * Find the last node in the master effects chain that feeds into masterPreGain.
   * Used when inserting a new effect (chorus, distortion, phaser) into the chain.
   * The cascade order reflects the signal flow: phaser < distortion < chorus < reverb < delay < distort < comp < eqHigh.
   */
  private getLastMasterChainNode(...exclude: (AudioNode | null)[]): AudioNode | null {
    const candidates: (AudioNode | null)[] = [
      this.phaserMerge,
      this.distortionMerge,
      this.chorusMerge,
      this.masterReverbMerge,
      this.masterDelayMerge,
      this.masterDistortMerge,
      this.masterComp,
      this.masterEQHigh,
    ];
    for (const node of candidates) {
      if (node && !exclude.includes(node)) return node;
    }
    return null;
  }

  /**
   * Insert a dry/wet effect pair into the master chain before masterPreGain.
   * Disconnects the current last node from masterPreGain and routes through dry/wet/merge.
   */
  private insertMasterEffect(
    dryGain: GainNode,
    wetInput: AudioNode,
    wetOutput: AudioNode,
    merge: GainNode,
    ...excludeFromChain: (AudioNode | null)[]
  ): void {
    const lastNode = this.getLastMasterChainNode(...excludeFromChain);
    if (lastNode && this.masterPreGain) {
      try { lastNode.disconnect(this.masterPreGain); } catch {}
      lastNode.connect(dryGain);
      lastNode.connect(wetInput);
      wetOutput.connect(merge);
      dryGain.connect(merge);
      merge.connect(this.masterPreGain);
    }
  }

  /**
   * Apply chorus effect using modulated delay lines
   */
  private applyChorusEffect(cfg: ChorusModule): void {
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext; // Use rawContext for direct Web Audio API nodes
    const now = ac.currentTime;

    if (!this.chorusDelay) {
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

      this.insertMasterEffect(dryGain, delay, delay, merge);
      delay.connect(wetGain);

      this.chorusDelay = delay;
      this.chorusLFO = lfo;
      this.chorusLFOGain = lfoGain;
      this.chorusDryGain = dryGain;
      this.chorusWetGain = wetGain;
      this.chorusMerge = merge;
    }

    this.chorusLFO!.frequency.setValueAtTime(cfg.rate, now);
    this.chorusLFOGain!.gain.setValueAtTime(cfg.depth * 0.005, now); // depth controls delay modulation range
    this.chorusDryGain!.gain.setValueAtTime(1 - cfg.mix, now);
    this.chorusWetGain!.gain.setValueAtTime(cfg.mix, now);
  }

  /**
   * Apply distortion effect using waveshaper
   */
  private applyDistortionEffect(cfg: DistortModule): void {
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext;
    const now = ac.currentTime;

    if (!this.distortionNode) {
      const distort = ac.createWaveShaper();
      distort.oversample = '4x';
      const dryGain = ac.createGain();
      const wetGain = ac.createGain();
      const merge = ac.createGain();

      this.insertMasterEffect(dryGain, distort, distort, merge, merge);
      distort.connect(wetGain);

      this.distortionNode = distort;
      this.distortionDryGain = dryGain;
      this.distortionWetGain = wetGain;
      this.distortionMerge = merge;
    }

    this.distortionNode!.curve = this.makeDistortionCurve(cfg.amount) as any;
    this.distortionDryGain!.gain.setValueAtTime(1 - cfg.mix, now);
    this.distortionWetGain!.gain.setValueAtTime(cfg.mix, now);
  }

  /**
   * Apply phaser effect using allpass filters modulated by LFO
   */
  private applyPhaserEffect(cfg: PhaserModule): void {
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext;
    const now = ac.currentTime;

    if (!this.phaserFilters) {
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

      this.insertMasterEffect(dryGain, filters[0], filters[filters.length - 1], merge, merge);
      filters[filters.length - 1].connect(wetGain);

      this.phaserFilters = filters;
      this.phaserLFO = lfo;
      this.phaserLFOGain = lfoGain;
      this.phaserDryGain = dryGain;
      this.phaserWetGain = wetGain;
      this.phaserMerge = merge;
    }

    // Update existing phaser params
    this.phaserLFO!.frequency.setValueAtTime(cfg.rate, now);
    this.phaserLFOGain!.gain.setValueAtTime(cfg.depth * 2000, now);
    this.phaserDryGain!.gain.setValueAtTime(1 - cfg.mix, now);
    this.phaserWetGain!.gain.setValueAtTime(cfg.mix, now);
  }

  /**
   * Apply EQ update in real-time
   */
  private applyEQUpdate(eqConfig: any): void {
    // Debug: console.log(`[Unified] EQ updated:`, eqConfig);
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext;
    const now = ac.currentTime;

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

    if (Tone.context) {
      const ac = Tone.context.rawContext as AudioContext;
      this.volumeGain.gain.setValueAtTime(linearGain, ac.currentTime);
    }

    // Debug: console.log(`[Unified] Volume updated to ${volume} dB (${linearGain.toFixed(3)} linear)`);
  }

  /**
   * Apply real-time tempo change without waiting for next loop
   */
  private applyRealTimeTempoChange(_oldTempo: number, newTempo: number): void {
    if (!this.currentPattern) return;

    // Debug: console.log(`[Tone] Tempo change: ${newTempo} BPM`);

    // Update Tone.Transport BPM
    Tone.Transport.bpm.value = newTempo;

    // We must rebuild the part because the groove offsets (in seconds) are based on the tempo-derived step interval
    if (this.isPlaying) {
      this.rebuildTonePart();
    }
  }

  /**
   * Apply real-time sequence change
   */
  private applyRealTimeSequenceChange(_oldPattern: ParsedPattern | null, _newPattern: ParsedPattern): void {
    // Debug: console.log(`[Tone] Sequence adjusted for pattern change`);

    // Rebuild the Tone.Part with the new sequence
    if (this.isPlaying) {
      this.rebuildTonePart();
    }
  }

  /**
   * Get current state with real-time calculations
   */
  getState(): UnifiedAudioState {
    const tempo = this.currentPattern?.tempo || 120;
    const volume = this.volumeGain ? 20 * Math.log10(this.volumeGain.gain.value) : -6;

    // Calculate real-time position using Tone.Transport
    let currentTime = Tone.Transport.seconds;
    if (this.tonePart && (this.tonePart.loopEnd as any) > 0) {
      currentTime = currentTime % (this.tonePart.loopEnd as any);
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

  // Obsolete custom loop duration methods removed — Tone.Transport handles this

  // getCurrentStep method removed - not currently used

  /**
   * Ensure master chain is created and connected:
   * EQLow -> EQMid -> EQHigh -> Comp -> Distortion(dry/wet) -> Delay(dry/wet) -> Reverb(dry/wet) -> PreGain -> MasterGain
   */
  private ensureMasterChain(): void {
    if (!Tone.context || !this.masterGain) return;
    if (this.masterEQLow && this.masterEQMid && this.masterEQHigh && this.masterComp && this.masterPreGain && this.masterChainInput) {
      return; // already created
    }

    const ac = Tone.context.rawContext as AudioContext;
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

    this.masterComp = Tone.context.createDynamicsCompressor();
    this.masterComp.threshold.setValueAtTime(-24, ac.currentTime);
    this.masterComp.ratio.setValueAtTime(4, ac.currentTime);
    this.masterComp.attack.setValueAtTime(0.01, ac.currentTime);
    this.masterComp.release.setValueAtTime(0.25, ac.currentTime);
    this.masterComp.knee.setValueAtTime(30, ac.currentTime);

    // Distortion with dry/wet mix (defaults to full dry = passthrough)
    this.masterDistortion = Tone.context.createWaveShaper();
    this.masterDistortion.oversample = '4x';
    this.masterDistortDryGain = Tone.context.createGain();
    this.masterDistortDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterDistortWetGain = Tone.context.createGain();
    this.masterDistortWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterDistortMerge = Tone.context.createGain();

    // Delay with feedback and dry/wet mix (defaults to full dry = passthrough)
    this.masterDelay = Tone.context.createDelay(2.0);
    this.masterDelay.delayTime.setValueAtTime(0.25, ac.currentTime);
    this.masterDelayFeedback = Tone.context.createGain();
    this.masterDelayFeedback.gain.setValueAtTime(0, ac.currentTime);
    this.masterDelayDryGain = Tone.context.createGain();
    this.masterDelayDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterDelayWetGain = Tone.context.createGain();
    this.masterDelayWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterDelayMerge = Tone.context.createGain();

    // Reverb with dry/wet mix (defaults to full dry = passthrough)
    this.masterReverb = Tone.context.createConvolver();
    // Generate a default short impulse response
    this.masterReverb.buffer = this.generateImpulseResponse(1.0, 0.01);
    this.masterReverbDryGain = Tone.context.createGain();
    this.masterReverbDryGain.gain.setValueAtTime(1, ac.currentTime);
    this.masterReverbWetGain = Tone.context.createGain();
    this.masterReverbWetGain.gain.setValueAtTime(0, ac.currentTime);
    this.masterReverbMerge = Tone.context.createGain();

    this.masterPreGain = Tone.context.createGain();
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
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext;
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
      console.log('[Unified] Default samples loaded');
    } catch (e) {
      console.error('[Unified] Error loading default samples:', e);
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
    if (!Tone.context) return null;
    const n = name.toLowerCase();
    const existing = this.instrumentChains.get(n);
    if (existing) return existing;

    const ac = Tone.context.rawContext as AudioContext;
    const now = ac.currentTime;
    const preGain = ac.createGain();
    preGain.gain.setValueAtTime(1, now);

    // Filter defaults to lowpass at 20000Hz (passthrough)
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(20000, now);
    filter.Q.setValueAtTime(1, now);

    const comp = ac.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-24, now);
    comp.ratio.setValueAtTime(4, now);
    comp.attack.setValueAtTime(0.01, now);
    comp.release.setValueAtTime(0.25, now);
    comp.knee.setValueAtTime(30, now);

    const eqLow = ac.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.setValueAtTime(150, now);
    eqLow.gain.setValueAtTime(0, now);

    const eqMid = ac.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.setValueAtTime(1000, now);
    eqMid.Q.setValueAtTime(1.0, now);
    eqMid.gain.setValueAtTime(0, now);

    const eqHigh = ac.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.setValueAtTime(6000, now);
    eqHigh.gain.setValueAtTime(0, now);

    // Pan defaults to center (0)
    const pan = ac.createStereoPanner();
    pan.pan.setValueAtTime(0, now);

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
    if (!Tone.context) return;
    const ac = Tone.context.rawContext as AudioContext;
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
    const ac = Tone.context.rawContext as AudioContext;
    const sampleRate = ac.sampleRate;
    const length = Math.floor(sampleRate * decay);
    const buffer = ac.createBuffer(2, length, sampleRate);
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
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const k = amount * 100;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Precision distortion curve formula: (3+k)*x*20*degToRad / (PI + k*|x|)
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + (k * Math.abs(x)));
    }
    return curve;
  }

  /**
   * Rebuild the Tone.Part based on the current pattern
   */
  private rebuildTonePart(): void {
    if (!this.currentPattern) return;

    // Dispose old part
    if (this.tonePart) {
      this.tonePart.dispose();
      this.tonePart = null;
    }

    const events: any[] = [];
    const totalSteps = this.currentPattern.totalSteps;
    const bpm = this.currentPattern.tempo;
    const stepInterval = 60 / bpm / 4; // 16th note in seconds

    // Calculate events for each instrument
    Object.entries(this.currentPattern.instruments).forEach(([instrumentName, instrumentData]) => {
      if (instrumentData.steps.length === 0) return;

      const steps = instrumentData.steps;
      const velocities = (instrumentData as any).velocities || [];

      // Use the max of instrument steps and total pattern steps for scheduling
      const scheduleLimit = Math.max(steps.length, totalSteps);

      for (let step = 0; step < scheduleLimit; step++) {
        // Determine hit based on overflow mode
        let isHit = false;
        let velocity = 0.7;

        if (this.overflowMode === 'loop') {
          const patternStep = step % steps.length;
          isHit = steps[patternStep] === true;
          velocity = velocities[patternStep] ?? 0.7;
        } else {
          if (step < steps.length) {
            isHit = steps[step] === true;
            velocity = velocities[step] ?? 0.7;
          }
        }

        if (isHit) {
          const isOddStep = step % 2 === 1;
          const baseTime = step * stepInterval;

          // Apply Groove/Swing
          const groove = this.currentPattern?.grooveModules?.[instrumentName.toLowerCase()] ||
                         this.currentPattern?.grooveModules?.['master'];

          let grooveOffset = 0;
          if (groove) {
            const amount = groove.amount;

            // Determine if this step should be affected by groove
            let isTargeted = false;
            if (groove.type === 'swing') {
              if (groove.steps) {
                // Explicit steps override subdivision-based targeting
                const targetSteps = groove.steps;
                if (targetSteps === 'odd') {
                  isTargeted = isOddStep;
                } else if (targetSteps === 'even') {
                  isTargeted = !isOddStep;
                } else if (targetSteps === 'all') {
                  isTargeted = true;
                } else if (targetSteps.includes(',')) {
                  const indices = targetSteps.split(',').map(s => parseInt(s.trim()));
                  isTargeted = indices.includes(step);
                } else if (!isNaN(parseInt(targetSteps))) {
                  isTargeted = parseInt(targetSteps) === step;
                }
              } else {
                // Subdivision-based targeting (default: 8n for audible swing)
                const subdivision = groove.subdivision || '8n';
                const stepsPerSubdiv = subdivision === '4n' ? 4 : subdivision === '8n' ? 2 : 1;
                isTargeted = Math.floor(step / stepsPerSubdiv) % 2 === 1;
              }
            } else {
              // Other grooves (humanize, rush, drag) usually apply to all or custom
              const targetSteps = groove.steps || 'all';
              if (targetSteps === 'all') {
                isTargeted = true;
              } else if (targetSteps === 'odd') {
                isTargeted = isOddStep;
              } else if (targetSteps === 'even') {
                isTargeted = !isOddStep;
              } else if (targetSteps.includes(',')) {
                const indices = targetSteps.split(',').map(s => parseInt(s.trim()));
                isTargeted = indices.includes(step);
              }
            }

            if (isTargeted) {
              if (groove.type === 'swing') {
                // Scale offset relative to the subdivision interval
                const subdivision = groove.subdivision || '8n';
                const stepsPerSubdiv = subdivision === '4n' ? 4 : subdivision === '8n' ? 2 : 1;
                grooveOffset = amount * (stepInterval * stepsPerSubdiv) * 0.33;
              } else if (groove.type === 'humanize') {
                grooveOffset = (Math.random() - 0.5) * amount * 0.05;
              } else if (groove.type === 'rush') {
                grooveOffset = -amount * 0.03;
              } else if (groove.type === 'drag') {
                grooveOffset = amount * 0.03;
              }
            }

            // Template groove: uses per-step offsets from a named preset
            if (groove.type === 'template' && groove.templateName) {
              const template = getGrooveTemplate(groove.templateName);
              if (template) {
                const applied = applyGrooveTemplate(template, step, amount);
                grooveOffset = applied.timingOffset * stepInterval;
                velocity = velocity * applied.velocityScale;
              }
            }
          }

          events.push({
            time: baseTime + grooveOffset,
            instrument: instrumentName,
            velocity: velocity,
            step,
            isOddStep,
            grooveOffset
          });
        }
      }
    });

    // Create the part
    this.tonePart = new Tone.Part((time, event) => {
      // Diagnostic log (optional, keep for debugging groove)
      if (event.grooveOffset !== 0) {
        // Only log sometimes to avoid spam
        // console.log(`[Groove] ${event.instrument} step ${event.step} offset ${event.grooveOffset.toFixed(4)}s`);
      }

      this.currentVelocity = event.velocity;
      this.scheduleInstrumentHit(event.instrument, time);
      this.currentVelocity = 0.7;
    }, events);

    // Configure looping
    this.tonePart.loop = true;
    this.tonePart.loopEnd = totalSteps * stepInterval;
    this.tonePart.start(0);

    console.log(`[Tone] Rebuilt part with ${events.length} events, loop length: ${this.tonePart.loopEnd.toFixed(3)}s`);
  }

  /**
   * Clear all scheduled events (timeout based)
   */
  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(id => window.clearTimeout(id));
    this.scheduledEvents = [];
  }

  /**
   * Obsolete custom scheduling method removed — Tone.Part handles this
   */

  /**
   * Schedule an instrument hit
   */
  private scheduleInstrumentHit(instrumentName: string, time: number): void {
    if (!this.masterGain) return;

    const ac = Tone.context.rawContext as AudioContext;
    const envelope = ac.createGain();
    const lowerName = instrumentName.toLowerCase();
    // Determine velocity for this hit (default 0.7 = normal)
    const velocity = this.currentVelocity;
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
      const source = Tone.context.createBufferSource();
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
      const oscillator = Tone.context.createOscillator();
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
          const bufferSize = Tone.context.sampleRate * 0.1;
          const buffer = Tone.context.createBuffer(1, bufferSize, Tone.context.sampleRate);
          const output = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
          const noise = Tone.context.createBufferSource();
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
    const now = Tone.context.currentTime;
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

  // Duplicate clearScheduledEvents removed

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
      this.rebuildTonePart();
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
