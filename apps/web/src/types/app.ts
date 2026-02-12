// Simplified app types for component-based architecture

export interface EQModule {
  name: string;
  low: number;    // -3 to +3
  mid: number;    // -3 to +3
  high: number;   // -3 to +3
}

export interface AmpModule {
  name: string;
  // gain in steps (-3..+3). Engine maps to dB/linear
  gain: number;
}

export interface CompModule {
  name: string;
  threshold: number; // dB (-60..0)
  ratio: number;     // (1..20)
  attack: number;    // seconds (0.001..0.3)
  release: number;   // seconds (0.02..1)
  knee: number;      // dB (0..40)
}

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface FilterModule {
  name: string;
  type: FilterType;   // filter type
  freq: number;       // 20-20000 Hz
  Q: number;          // 0.1-30
}

export interface DelayModule {
  name: string;
  time: number;       // 0.01-2.0 seconds
  feedback: number;   // 0-0.95
  mix: number;        // 0-1 (dry/wet)
}

export interface ReverbModule {
  name: string;
  mix: number;        // 0-1 (dry/wet)
  decay: number;      // 0.1-10 seconds
  predelay: number;   // 0-0.1 seconds
}

export interface PanModule {
  name: string;
  value: number;      // -1 (left) to 1 (right)
}

export interface DistortModule {
  name: string;
  amount: number;     // 0-1
  mix: number;        // 0-1 (dry/wet)
}

export type LFOWave = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface LFOModule {
  // key like 'master.amp' or 'kick.amp'
  key: string;
  scope: 'master' | 'instrument';
  target: 'amp';
  name: string; // instrument name or 'master'
  rateHz: number; // 0.1..20
  depth: number;  // 0..1
  wave: LFOWave;
}

export interface SampleModule {
  // instrument name to map (e.g., 'kick')
  name: string;
  // sample identifier from preloaded bank (e.g., 'kick', 'snare')
  sample: string;
  // optional gain in steps (-3..+3) applied at trigger
  gain?: number;
}

export interface ParsedPattern {
  tempo: number;
  instruments: {
    [instrumentName: string]: {
      steps: boolean[];
      name: string;
    };
  };
  sampleModules?: {
    [instrumentName: string]: SampleModule;
  };
  eqModules?: {
    [moduleName: string]: EQModule;
  };
  ampModules?: {
    [moduleName: string]: AmpModule;
  };
  compModules?: {
    [moduleName: string]: CompModule;
  };
  filterModules?: {
    [moduleName: string]: FilterModule;
  };
  delayModules?: {
    [moduleName: string]: DelayModule;
  };
  reverbModules?: {
    [moduleName: string]: ReverbModule;
  };
  panModules?: {
    [moduleName: string]: PanModule;
  };
  distortModules?: {
    [moduleName: string]: DistortModule;
  };
  lfoModules?: {
    [key: string]: LFOModule; // keyed by 'name.target' (e.g., 'kick.amp')
  };
  totalSteps: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validInstruments: string[];
  invalidInstruments: string[];
}

export interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  tempo: number;
  volume: number;
  currentTime: number;
  error: string | null;
}


export interface UnifiedAudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  tempo: number;
  volume: number;
  currentTime: number;
  error: string | null;
  // Unified-specific state
  effectsEnabled: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  overflowMode?: 'loop' | 'rest';
}

export interface UIState {
  activeTab: 'editor' | 'patterns' | 'settings';
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
}

export interface AppState {
  // Pattern state
  currentPattern: string;
  parsedPattern: ParsedPattern | null;
  validation: ValidationResult | null;

  // Audio state - using unified audio state
  audio: UnifiedAudioState;

  // UI state
  ui: UIState;
}

export interface AppActions {
  // Pattern actions
  updatePattern: (pattern: string) => void;
  setCursorPosition: (position: number) => void;
  loadPattern: (patternId: string) => Promise<void>;
  loadPatternContent: (content: string) => void;

  // Audio actions
  initializeAudio: () => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setTempo: (tempo: number) => void;
  setVolume: (volume: number) => void;
  setOverflowMode?: (mode: 'loop' | 'rest') => void;

  // UI actions
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
}
