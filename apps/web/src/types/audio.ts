// Audio-related types for the ASCII Generative Sequencer

export interface AudioEngineState {
  isPlaying: boolean;
  isInitialized: boolean;
  tempo: number;
  currentTime: number;
  volume: number;
  error: string | null;
}

export interface PatternStep {
  instrument: string;
  step: number;
  isHit: boolean;
}

// ParsedPattern moved to ../types/app.ts to avoid duplication

export interface AudioEngineConfig {
  tempo: number;
  volume: number;
  instruments: {
    kick: boolean;
    snare: boolean;
    hihat: boolean;
  };
}

export type AudioEngineAction =
  | { type: 'INITIALIZE' }
  | { type: 'INITIALIZE_SUCCESS' }
  | { type: 'INITIALIZE_ERROR'; error: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SET_TEMPO'; tempo: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'CLEAR_ERROR' };

export interface AudioEngineHook {
  state: AudioEngineState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setTempo: (tempo: number) => void;
  setVolume: (volume: number) => void;
  loadPattern: (pattern: string) => void;
  initialize: () => void;
}
