// Module architecture types for the ASCII Generative Sequencer

export interface ModuleData {
  id: string;
  type: ModuleType;
  state: ModuleState;
  data: any;
  metadata: ModuleMetadata;
}

export type ModuleType = 'editor' | 'audio' | 'ai' | 'patterns';

export interface ModuleState {
  isActive: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export interface ModuleMetadata {
  name: string;
  description: string;
  version: string;
  capabilities: ModuleCapabilities;
  visualization: VisualizationConfig;
}

export interface ModuleCapabilities {
  canVisualize: boolean;
  canExport: boolean;
  canImport: boolean;
  canShare: boolean;
  canAnalyze: boolean;
}

export interface VisualizationConfig {
  type: VisualizationType;
  component: string;
  props: Record<string, any>;
  responsive: boolean;
  realTime: boolean;
}

export type VisualizationType =
  | 'grid'
  | 'waveform'
  | 'chart'
  | 'thumbnail'
  | 'preview'
  | 'indicator'
  | 'comparison';

export interface ModuleInterface {
  // Core module methods
  initialize(): Promise<void>;
  destroy(): void;
  getState(): ModuleState;
  getData(): any;
  updateData(data: any): void;

  // Visualization methods
  getVisualizationConfig(): VisualizationConfig;
  renderVisualization(): React.ReactElement;
  updateVisualization(data: any): void;

  // Module-specific methods
  [key: string]: any;
}

export interface ModuleManager {
  modules: Map<string, ModuleInterface>;
  activeModule: string | null;

  registerModule(module: ModuleInterface): void;
  unregisterModule(id: string): void;
  getModule(id: string): ModuleInterface | null;
  setActiveModule(id: string): void;
  getAllModules(): ModuleInterface[];
}

// Module-specific data interfaces
export interface EditorModuleData {
  content: string;
  cursorPosition: number;
  selection: { start: number; end: number } | null;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  pattern: ParsedPattern | null;
}

export interface AudioModuleData {
  isPlaying: boolean;
  tempo: number;
  volume: number;
  currentTime: number;
  pattern: ParsedPattern | null;
  waveform: number[];
}

export interface AIModuleData {
  messages: ChatMessage[];
  suggestions: AISuggestion[];
  analysis: PatternAnalysis | null;
  isProcessing: boolean;
}

export interface PatternsModuleData {
  patterns: SavedPattern[];
  categories: PatternCategory[];
  searchQuery: string;
  selectedPattern: string | null;
}

// Supporting interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AISuggestion {
  id: string;
  type: 'pattern' | 'tempo' | 'instrument';
  confidence: number;
  original: string;
  suggested: string;
  reasoning: string;
}

export interface PatternAnalysis {
  complexity: number;
  density: number;
  balance: Record<string, number>;
  uniqueness: number;
  recommendations: string[];
}

export interface SavedPattern {
  id: string;
  name: string;
  content: string;
  pattern: ParsedPattern;
  metadata: {
    tempo: number;
    complexity: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PatternCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  patternIds: string[];
}

// Re-export from audio types
export interface ParsedPattern {
  tempo: number;
  instruments: {
    [instrumentName: string]: {
      steps: boolean[];
      name: string;
    };
  };
  totalSteps: number;
}
