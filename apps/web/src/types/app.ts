// Simplified app types for component-based architecture

export interface EQModule {
  name: string;
  low: number;    // -3 to +3
  mid: number;    // -3 to +3
  high: number;   // -3 to +3
}

export interface ParsedPattern {
  tempo: number;
  instruments: {
    [instrumentName: string]: {
      steps: boolean[];
      name: string;
    };
  };
  eqModules?: {
    [moduleName: string]: EQModule;
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

  // UI actions
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
}
