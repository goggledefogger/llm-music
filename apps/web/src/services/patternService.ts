// Pattern service for managing pattern storage and retrieval
import { STORAGE_CONSTANTS } from '@ascii-sequencer/shared';
import { ParsedPattern } from '../types/app';
import { PatternParser } from './patternParser';

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
      // Convert date strings back to Date objects and ensure parsed data exists
      return patterns.map((pattern: any) => {
        let parsed = pattern.parsedPattern;
        if (!parsed && typeof pattern.content === 'string') {
          try {
            parsed = PatternParser.parse(pattern.content);
          } catch (err) {
            parsed = {
              tempo: 120,
              instruments: {},
              sampleModules: {},
              eqModules: {},
              ampModules: {},
              compModules: {},
              lfoModules: {},
              totalSteps: 16
            };
          }
        }

        return {
          ...pattern,
          name: pattern.name ?? 'Untitled Pattern',
          category: pattern.category ?? 'Uncategorized',
          parsedPattern: parsed,
          createdAt: new Date(pattern.createdAt),
          updatedAt: new Date(pattern.updatedAt)
        } as StoredPattern;
      });
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
      },
      {
        id: 'sample-7',
        name: 'Classic Hip Hop',
        category: 'Hip Hop',
        content: `TEMPO 95

# EQ Settings
eq master: low=1 mid=1 high=0
eq kick: low=2 mid=-1 high=0
eq snare: low=0 mid=2 high=1

seq kick: x..x...x.x..x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 95,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, false, true, false, true, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            hihat: { name: 'hihat', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {
            master: { name: 'master', low: 1, mid: 1, high: 0 },
            kick: { name: 'kick', low: 2, mid: -1, high: 0 },
            snare: { name: 'snare', low: 0, mid: 2, high: 1 }
          },
          totalSteps: 16
        },
        complexity: 0.6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-8',
        name: 'Trap Beat',
        category: 'Trap',
        content: `TEMPO 140

seq kick: x..x..x.x.x.x...
seq snare: ....x.......x...
seq hihat: x.x.x.xx.xx.x.x.`,
        parsedPattern: {
          tempo: 140,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, true, false, true, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            hihat: { name: 'hihat', steps: [true, false, true, false, true, false, true, true, false, true, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-9',
        name: 'Reggaeton Rhythm',
        category: 'Reggaeton',
        content: `TEMPO 98

seq kick: x..x..x..x..x..x.
seq snare: .x..x..x..x..x..x`,
        parsedPattern: {
          tempo: 98,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true] },
            snare: { name: 'snare', steps: [false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-10',
        name: 'Lo-fi Groove',
        category: 'Lo-fi',
        content: `TEMPO 85

seq kick: x....x..x....x..
seq snare: ....x.......x...
seq perc: .x.x.x.x.x.x.x.x`,
        parsedPattern: {
          tempo: 85,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            perc: { name: 'perc', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-11',
        name: 'Synthwave Drive',
        category: 'Synthwave',
        content: `TEMPO 110

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq bass: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 110,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            bass: { name: 'bass', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-12',
        name: 'Drum and Bass',
        category: 'Drum and Bass',
        content: `TEMPO 170

seq kick: x..x..x.x..x....
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 170,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            hihat: { name: 'hihat', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.8,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-13',
        name: 'Trance Anthem',
        category: 'Trance',
        content: `TEMPO 138

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq arpeggio: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 138,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            arpeggio: { name: 'arpeggio', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-14',
        name: 'Dubstep Wobble',
        category: 'Dubstep',
        content: `TEMPO 140

seq kick: x...x...........
seq snare: ....x.......x...
seq wobble: x.x.....x.x.....`,
        parsedPattern: {
          tempo: 140,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            wobble: { name: 'wobble', steps: [true, false, true, false, false, false, false, false, true, false, true, false, false, false, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-15',
        name: 'Funk Groove',
        category: 'Funk',
        content: `TEMPO 115

seq kick: x..x.x..x..x.x..
seq snare: ..x...x...x...x.
seq bass: x.x.x...x.x.x...`,
        parsedPattern: {
          tempo: 115,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, true, false, false, true, false, false, true, false, true, false, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            bass: { name: 'bass', steps: [true, false, true, false, true, false, false, false, true, false, true, false, true, false, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-16',
        name: 'Afrobeat Pattern',
        category: 'Afrobeat',
        content: `TEMPO 110

seq kick: x..x..x.x..x..x.
seq snare: ..x...x...x...x.
seq shaker: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 110,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            shaker: { name: 'shaker', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.8,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-17',
        name: 'Salsa Rhythm',
        category: 'Salsa',
        content: `TEMPO 180

seq clave: x..x..x.x..x..x.
seq conga: .x.x.x..x.x.x..
seq cowbell: x...x...x...x...`,
        parsedPattern: {
          tempo: 180,
          instruments: {
            clave: { name: 'clave', steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false] },
            conga: { name: 'conga', steps: [false, true, false, true, false, true, false, false, true, false, true, false, true, false, false, false] },
            cowbell: { name: 'cowbell', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.9,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-18',
        name: 'Jazz Swing',
        category: 'Jazz',
        content: `TEMPO 130

seq ride: x.x.x.x.x.x.x.x.
seq snare: ..s...s...s...s.
seq kick: x.....x.......x.`,
        parsedPattern: {
          tempo: 130,
          instruments: {
            ride: { name: 'ride', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            kick: { name: 'kick', steps: [true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-19',
        name: 'Blues Shuffle',
        category: 'Blues',
        content: `TEMPO 110

seq kick: x.x.x.x.x.x.x.x.
seq snare: ..x...x...x...x.
seq guitar: x..x..x..x..x..x.`,
        parsedPattern: {
          tempo: 110,
          instruments: {
            kick: { name: 'kick', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            guitar: { name: 'guitar', steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-20',
        name: 'Country Two-Step',
        category: 'Country',
        content: `TEMPO 140

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq bass: x.x.x...x.x.x...`,
        parsedPattern: {
          tempo: 140,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            bass: { name: 'bass', steps: [true, false, true, false, true, false, false, false, true, false, true, false, true, false, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-21',
        name: 'Metal Blast Beat',
        category: 'Metal',
        content: `TEMPO 200

seq kick: x.x.x.x.x.x.x.x.
seq snare: .x.x.x.x.x.x.x.x
seq cymbal: xxxxxxxxxxxxxxxx`,
        parsedPattern: {
          tempo: 200,
          instruments: {
            kick: { name: 'kick', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
            snare: { name: 'snare', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true] },
            cymbal: { name: 'cymbal', steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.9,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-22',
        name: 'Punk Rock Beat',
        category: 'Punk Rock',
        content: `TEMPO 180

seq kick: x.x.x.x.x.x.x.x.
seq snare: ..x...x...x...x.
seq hihat: xxxxxxxxxxxxxxxx`,
        parsedPattern: {
          tempo: 180,
          instruments: {
            kick: { name: 'kick', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            hihat: { name: 'hihat', steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.7,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-23',
        name: 'Pop Ballad',
        category: 'Pop',
        content: `TEMPO 80

seq kick: x.......x.......
seq snare: ....x.......x...
seq piano: x.x.x.x.x.x.x.x.`,
        parsedPattern: {
          tempo: 80,
          instruments: {
            kick: { name: 'kick', steps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false] },
            snare: { name: 'snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
            piano: { name: 'piano', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-24',
        name: 'Reggae One Drop',
        category: 'Reggae',
        content: `TEMPO 140

seq kick: ..x...x...x...x.
seq snare: ..x...x...x...x.
seq hihat: .x.x.x.x.x.x.x.x`,
        parsedPattern: {
          tempo: 140,
          instruments: {
            kick: { name: 'kick', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
            hihat: { name: 'hihat', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-25',
        name: 'Simple Canon',
        category: 'Classical',
        content: `TEMPO 100

seq melody1: x...x...x...x...
seq melody2: .x..x..x..x..x..`,
        parsedPattern: {
          tempo: 100,
          instruments: {
            melody1: { name: 'melody1', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
            melody2: { name: 'melody2', steps: [false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      },
      {
        id: 'sample-26',
        name: 'Experimental Noise',
        category: 'Experimental',
        content: `TEMPO 150

seq noise1: x.xx.x.xx.x.xx.x
seq noise2: .x..x.x..x.x..x.x`,
        parsedPattern: {
          tempo: 150,
          instruments: {
            noise1: { name: 'noise1', steps: [true, false, true, true, false, true, false, true, true, false, true, false, true, true, false, true] },
            noise2: { name: 'noise2', steps: [false, true, false, false, true, false, true, false, false, true, false, true, false, false, true, false] }
          },
          eqModules: {},
          totalSteps: 16
        },
        complexity: 0.9,
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
