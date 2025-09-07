// Pattern service for managing pattern storage and retrieval
import { STORAGE_CONSTANTS } from '@ascii-sequencer/shared';
import { ParsedPattern } from '../types/app';

export interface StoredPattern {
  id: string;
  name: string;
  category: string;
  content: string;
  parsedPattern: ParsedPattern;
  complexity: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  userId?: string;
}

export class PatternService {
  private static readonly STORAGE_KEY = STORAGE_CONSTANTS.PATTERNS_KEY;

  /**
   * Get all stored patterns from localStorage
   */
  static getStoredPatterns(): StoredPattern[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const patterns = JSON.parse(stored);
      // Convert date strings back to Date objects
      return patterns.map((pattern: any) => ({
        ...pattern,
        createdAt: new Date(pattern.createdAt),
        updatedAt: new Date(pattern.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading patterns from storage:', error);
      return [];
    }
  }

  /**
   * Save patterns to localStorage
   */
  static savePatterns(patterns: StoredPattern[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
    } catch (error) {
      console.error('Error saving patterns to storage:', error);
    }
  }

  /**
   * Get a specific pattern by ID
   */
  static getPatternById(id: string): StoredPattern | null {
    const patterns = this.getStoredPatterns();
    return patterns.find(pattern => pattern.id === id) || null;
  }

  /**
   * Save a new pattern or update an existing one
   */
  static savePattern(pattern: Omit<StoredPattern, 'id' | 'createdAt' | 'updatedAt'>): StoredPattern {
    const patterns = this.getStoredPatterns();
    const now = new Date();

    const newPattern: StoredPattern = {
      ...pattern,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    patterns.push(newPattern);
    this.savePatterns(patterns);
    return newPattern;
  }

  /**
   * Update an existing pattern
   */
  static updatePattern(id: string, updates: Partial<Omit<StoredPattern, 'id' | 'createdAt'>>): StoredPattern | null {
    const patterns = this.getStoredPatterns();
    const index = patterns.findIndex(pattern => pattern.id === id);

    if (index === -1) return null;

    const updatedPattern: StoredPattern = {
      ...patterns[index],
      ...updates,
      updatedAt: new Date()
    };

    patterns[index] = updatedPattern;
    this.savePatterns(patterns);
    return updatedPattern;
  }

  /**
   * Delete a pattern by ID
   */
  static deletePattern(id: string): boolean {
    const patterns = this.getStoredPatterns();
    const filteredPatterns = patterns.filter(pattern => pattern.id !== id);

    if (filteredPatterns.length === patterns.length) {
      return false; // Pattern not found
    }

    this.savePatterns(filteredPatterns);
    return true;
  }

  /**
   * Get patterns by category
   */
  static getPatternsByCategory(category: string): StoredPattern[] {
    const patterns = this.getStoredPatterns();
    return patterns.filter(pattern => pattern.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Search patterns by name or content
   */
  static searchPatterns(query: string): StoredPattern[] {
    const patterns = this.getStoredPatterns();
    const lowerQuery = query.toLowerCase();

    return patterns.filter(pattern =>
      pattern.name.toLowerCase().includes(lowerQuery) ||
      pattern.content.toLowerCase().includes(lowerQuery) ||
      pattern.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get the default sample patterns
   */
  static getSamplePatterns(): StoredPattern[] {
    return [
      {
        id: 'sample-1',
        name: 'Basic House Beat',
        category: 'House',
        content: `TEMPO 128

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=0 high=-1
eq snare: low=-1 mid=2 high=1

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: xxxxxxxxxxxxxxxx`,
        parsedPattern: {
          tempo: 128,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            hihat: { name: 'hihat', steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 },
            kick: { name: 'kick', low: 2, mid: 0, high: -1 },
            snare: { name: 'snare', low: -1, mid: 2, high: 1 }
          },
          totalSteps: 16
        },
        complexity: 0.6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-2',
        name: 'Minimal Techno',
        category: 'Techno',
        content: `TEMPO 130

# EQ Settings
eq master: low=0 mid=0 high=0

seq kick: x...x...x...x...
seq hat: .x.x.x.x.x.x.x.x`,
        parsedPattern: {
          tempo: 130,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            hat: { name: 'hat', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 }
          },
          totalSteps: 16
        },
        complexity: 0.3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-3',
        name: 'Complex Breakbeat',
        category: 'Breakbeat',
        content: `TEMPO 140

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=0 high=-1
eq snare: low=-1 mid=2 high=1
eq hihat: low=-2 mid=0 high=2

seq kick: x..x.x..x..x.x..
seq snare: ..x...x...x...x.
seq hihat: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 140,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, true, false, false, true, false, false, true, false, true, false, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            hihat: { name: 'hihat', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 },
            kick: { name: 'kick', low: 2, mid: 0, high: -1 },
            snare: { name: 'snare', low: -1, mid: 2, high: 1 },
            hihat: { name: 'hihat', low: -2, mid: 0, high: 2 }
          },
          totalSteps: 16
        },
        complexity: 0.8,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-4',
        name: 'Simple Rock',
        category: 'Rock',
        content: `TEMPO 120

# EQ Settings
eq master: low=0 mid=0 high=0

seq kick: x...x...
seq snare: ..x...x.`,
        parsedPattern: {
          tempo: 120,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 }
          },
          totalSteps: 8
        },
        complexity: 0.4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-5',
        name: 'Jungle Pattern',
        category: 'Jungle',
        content: `TEMPO 160

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=0 high=-1
eq snare: low=-1 mid=2 high=1
eq hihat: low=-2 mid=0 high=2

seq kick: x..x..x..x..x..x.
seq snare: ..x...x...x...x.
seq hihat: xx.xxx.xxx.xxx.xx`,
        parsedPattern: {
          tempo: 160,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            hihat: { name: 'hihat', steps: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 },
            kick: { name: 'kick', low: 2, mid: 0, high: -1 },
            snare: { name: 'snare', low: -1, mid: 2, high: 1 },
            hihat: { name: 'hihat', low: -2, mid: 0, high: 2 }
          },
          totalSteps: 16
        },
        complexity: 0.7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-6',
        name: 'Ambient Drone',
        category: 'Ambient',
        content: `TEMPO 60

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=0 high=-1
eq pad: low=0 mid=1 high=1

seq kick: x.......
seq pad: xxxxxxxx`,
        parsedPattern: {
          tempo: 60,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, false, false, false, false] },
            pad: { name: 'pad', steps: [true, true, true, true, true, true, true, true] }
          },
          eqModules: {
            master: { name: 'master', low: 0, mid: 0, high: 0 },
            kick: { name: 'kick', low: 2, mid: 0, high: -1 },
            pad: { name: 'pad', low: 0, mid: 1, high: 1 }
          },
          totalSteps: 8
        },
        complexity: 0.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      }
    ];
  }

  /**
   * Initialize storage with sample patterns if empty
   */
  static initializeStorage(): void {
    const existingPatterns = this.getStoredPatterns();
    if (existingPatterns.length === 0) {
      const samplePatterns = this.getSamplePatterns();
      this.savePatterns(samplePatterns);
    }
  }

  /**
   * Generate a unique ID for patterns
   */
  private static generateId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
