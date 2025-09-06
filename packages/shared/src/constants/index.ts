// Audio Constants
export const AUDIO_CONSTANTS = {
  DEFAULT_TEMPO: 120,
  MIN_TEMPO: 60,
  MAX_TEMPO: 200,
  DEFAULT_VOLUME: 0.8,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  DEFAULT_LATENCY: 100,
  MIN_LATENCY: 0,
  MAX_LATENCY: 1000,
  DEFAULT_SAMPLE_RATE: 44100,
  DEFAULT_BUFFER_SIZE: 512,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  EDITOR_WIDTH_PERCENT: 70,
  CHAT_WIDTH_PERCENT: 30,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1200,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
} as const;

// DSL Constants
export const DSL_CONSTANTS = {
  KEYWORDS: [
    'TEMPO',
    'SWING',
    'SCALE',
    'inst',
    'seq',
    'pattern',
    'loop',
    'volume',
    'pan',
    'filter',
    'reverb',
    'delay',
  ] as const,
  INSTRUMENTS: [
    'kick',
    'snare',
    'hihat',
    'pad',
    'bass',
    'lead',
    'pluck',
    'bell',
  ] as const,
  SCALES: [
    'C major',
    'G major',
    'D major',
    'A major',
    'E major',
    'B major',
    'F# major',
    'C# major',
    'A minor',
    'E minor',
    'B minor',
    'F# minor',
    'C# minor',
    'G# minor',
    'D# minor',
    'A# minor',
    'C dorian',
    'D dorian',
    'E dorian',
    'F dorian',
    'G dorian',
    'A dorian',
    'B dorian',
  ] as const,
  PATTERN_SYMBOLS: {
    HIT: 'x',
    REST: '.',
    ACCENT: 'X',
    GHOST: 'o',
    FLAM: 'f',
    ROLL: 'r',
  } as const,
} as const;

// API Constants
export const API_CONSTANTS = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://ascii-sequencer.vercel.app/api'
    : 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Storage Constants
export const STORAGE_CONSTANTS = {
  PATTERNS_KEY: 'ascii-sequencer-patterns',
  USER_PREFERENCES_KEY: 'ascii-sequencer-preferences',
  CHAT_HISTORY_KEY: 'ascii-sequencer-chat-history',
  SESSION_KEY: 'ascii-sequencer-session',
  CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Error Constants
export const ERROR_CONSTANTS = {
  AUDIO_CONTEXT_FAILED: 'AUDIO_CONTEXT_FAILED',
  PATTERN_PARSE_ERROR: 'PATTERN_PARSE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Performance Constants
export const PERFORMANCE_CONSTANTS = {
  MAX_PATTERN_LENGTH: 10000,
  MAX_CHAT_HISTORY: 100,
  MAX_VISUALIZATION_FPS: 60,
  MAX_AUDIO_LATENCY: 200,
  MEMORY_LIMIT: 50 * 1024 * 1024, // 50MB
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  AI_INTEGRATION: true,
  VISUALIZATION: true,
  PATTERN_SHARING: true,
  AUDIO_EXPORT: true,
  MOBILE_OPTIMIZATION: true,
  OFFLINE_MODE: false,
  COLLABORATION: false,
} as const;
