import { z } from 'zod';

// User Types
export const UserPreferencesSchema = z.object({
  audioLatency: z.number().min(0).max(1000).default(100),
  visualizationEnabled: z.boolean().default(true),
  aiModel: z.enum(['openai', 'webllm']).default('openai'),
  theme: z.enum(['dark', 'light']).default('dark'),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  preferences: UserPreferencesSchema,
  createdAt: z.date(),
  lastActiveAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Pattern Types
export const PatternMetadataSchema = z.object({
  tempo: z.number().min(60).max(200).default(120),
  timeSignature: z.string().default('4/4'),
  instruments: z.array(z.string()).default([]),
  duration: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const PatternSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  content: z.string(),
  metadata: PatternMetadataSchema,
  isPublic: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Pattern = z.infer<typeof PatternSchema>;
export type PatternMetadata = z.infer<typeof PatternMetadataSchema>;

// Session Types
export const SessionEventSchema = z.object({
  type: z.enum(['pattern_edit', 'ai_interaction', 'audio_play', 'export']),
  timestamp: z.date(),
  data: z.record(z.any()),
});

export const AudioDataSchema = z.object({
  latency: z.number().optional(),
  sampleRate: z.number().optional(),
  bufferSize: z.number().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  patternId: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  events: z.array(SessionEventSchema).default([]),
  audioData: AudioDataSchema.optional(),
});

export type Session = z.infer<typeof SessionSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;
export type AudioData = z.infer<typeof AudioDataSchema>;

// Audio Engine Types
export const InstrumentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['kick', 'snare', 'hihat', 'pad', 'bass']),
  volume: z.number().min(0).max(1).default(0.8),
  pan: z.number().min(-1).max(1).default(0),
  enabled: z.boolean().default(true),
});

export const AudioEngineStateSchema = z.object({
  isPlaying: z.boolean().default(false),
  tempo: z.number().min(60).max(200).default(120),
  currentTime: z.number().min(0).default(0),
  volume: z.number().min(0).max(1).default(0.8),
  instruments: z.array(InstrumentStateSchema).default([]),
});

export type AudioEngineState = z.infer<typeof AudioEngineStateSchema>;
export type InstrumentState = z.infer<typeof InstrumentStateSchema>;

// AI Service Types
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
});

export const AIServiceStateSchema = z.object({
  isGenerating: z.boolean().default(false),
  chatHistory: z.array(ChatMessageSchema).default([]),
  currentModel: z.enum(['openai', 'webllm']).default('openai'),
  apiKey: z.string().nullable().default(null),
});

export type AIServiceState = z.infer<typeof AIServiceStateSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Visualization Types
export const VisualizationStateSchema = z.object({
  isEnabled: z.boolean().default(true),
  volumeMeter: z.boolean().default(true),
  waveform: z.boolean().default(true),
  frequencySpectrum: z.boolean().default(false),
  signalFlow: z.boolean().default(false),
});

export type VisualizationState = z.infer<typeof VisualizationStateSchema>;

// UI Types
export const UIStateSchema = z.object({
  sidebarOpen: z.boolean().default(true),
  activeTab: z.enum(['editor', 'chat', 'patterns']).default('editor'),
  theme: z.enum(['dark', 'light']).default('dark'),
  layout: z.enum(['desktop', 'mobile']).default('desktop'),
});

export type UIState = z.infer<typeof UIStateSchema>;

// App State
export const AppStateSchema = z.object({
  user: UserSchema.nullable().default(null),
  patterns: z.array(PatternSchema).default([]),
  currentPattern: PatternSchema.nullable().default(null),
  audioEngine: AudioEngineStateSchema,
  aiService: AIServiceStateSchema,
  visualization: VisualizationStateSchema,
  ui: UIStateSchema,
});

export type AppState = z.infer<typeof AppStateSchema>;

// API Types
export const CreatePatternRequestSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  metadata: PatternMetadataSchema.optional(),
  isPublic: z.boolean().default(false),
});

export const UpdatePatternRequestSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().optional(),
  metadata: PatternMetadataSchema.optional(),
  isPublic: z.boolean().optional(),
});

export const AIGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  context: z.string().optional(),
  style: z.enum(['drum', 'ambient', 'bass', 'experimental']).optional(),
});

export const AIGenerateResponseSchema = z.object({
  content: z.string(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});

export type CreatePatternRequest = z.infer<typeof CreatePatternRequestSchema>;
export type UpdatePatternRequest = z.infer<typeof UpdatePatternRequestSchema>;
export type AIGenerateRequest = z.infer<typeof AIGenerateRequestSchema>;
export type AIGenerateResponse = z.infer<typeof AIGenerateResponseSchema>;

// Error Types
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    timestamp: z.string(),
    requestId: z.string(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
