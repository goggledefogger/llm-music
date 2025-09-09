import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternService, StoredPattern } from './patternService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PatternService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getStoredPatterns', () => {
    it('should return empty array when no patterns are stored', () => {
      const patterns = PatternService.getStoredPatterns();
      expect(patterns).toEqual([]);
    });

    it('should return stored patterns when they exist', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'Test Pattern',
          category: 'Test',
          content: 'TEMPO 120\nseq kick: x...x...',
          parsedPattern: {
            tempo: 120,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const patterns = PatternService.getStoredPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Test Pattern');
      expect(patterns[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const patterns = PatternService.getStoredPatterns();
      expect(patterns).toEqual([]);
    });

    it('should parse content and apply defaults when parsedPattern is missing', () => {
      const mockPatterns = [
        {
          id: 'test-2',
          content: 'TEMPO 120\nseq kick: x...',
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));

      const patterns = PatternService.getStoredPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].parsedPattern).toBeTruthy();
      expect(patterns[0].name).toBe('Untitled Pattern');
      expect(patterns[0].category).toBe('Uncategorized');
    });
  });

  describe('savePatterns', () => {
    it('should save patterns to localStorage', () => {
      const patterns: StoredPattern[] = [
        {
          id: 'test-1',
          name: 'Test Pattern',
          category: 'Test',
          content: 'TEMPO 120\nseq kick: x...x...',
          parsedPattern: {
            tempo: 120,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      PatternService.savePatterns(patterns);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ascii-sequencer-patterns',
        JSON.stringify(patterns)
      );
    });
  });

  describe('getPatternById', () => {
    it('should return null when pattern is not found', () => {
      const pattern = PatternService.getPatternById('non-existent');
      expect(pattern).toBeNull();
    });

    it('should return pattern when found', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'Test Pattern',
          category: 'Test',
          content: 'TEMPO 120\nseq kick: x...x...',
          parsedPattern: {
            tempo: 120,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const pattern = PatternService.getPatternById('test-1');
      expect(pattern).toBeTruthy();
      expect(pattern?.name).toBe('Test Pattern');
    });
  });

  describe('savePattern', () => {
    it('should save a new pattern with generated ID and timestamps', () => {
      const patternData = {
        name: 'New Pattern',
        category: 'Test',
        content: 'TEMPO 120\nseq kick: x...x...',
        parsedPattern: {
          tempo: 120,
          instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
          eqModules: {},
          totalSteps: 8
        },
        complexity: 0.5
      };

      const savedPattern = PatternService.savePattern(patternData);
      
      expect(savedPattern.id).toMatch(/^pattern-\d+-[a-z0-9]+$/);
      expect(savedPattern.name).toBe('New Pattern');
      expect(savedPattern.createdAt).toBeInstanceOf(Date);
      expect(savedPattern.updatedAt).toBeInstanceOf(Date);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('updatePattern', () => {
    it('should return null when pattern is not found', () => {
      const result = PatternService.updatePattern('non-existent', { name: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update existing pattern', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'Test Pattern',
          category: 'Test',
          content: 'TEMPO 120\nseq kick: x...x...',
          parsedPattern: {
            tempo: 120,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const result = PatternService.updatePattern('test-1', { name: 'Updated Pattern' });
      
      expect(result).toBeTruthy();
      expect(result?.name).toBe('Updated Pattern');
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('deletePattern', () => {
    it('should return false when pattern is not found', () => {
      const result = PatternService.deletePattern('non-existent');
      expect(result).toBe(false);
    });

    it('should delete existing pattern', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'Test Pattern',
          category: 'Test',
          content: 'TEMPO 120\nseq kick: x...x...',
          parsedPattern: {
            tempo: 120,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const result = PatternService.deletePattern('test-1');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ascii-sequencer-patterns',
        '[]'
      );
    });
  });

  describe('getPatternsByCategory', () => {
    it('should return patterns filtered by category', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'House Pattern',
          category: 'House',
          content: 'TEMPO 128\nseq kick: x...x...',
          parsedPattern: {
            tempo: 128,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'test-2',
          name: 'Techno Pattern',
          category: 'Techno',
          content: 'TEMPO 130\nseq kick: x...x...',
          parsedPattern: {
            tempo: 130,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const housePatterns = PatternService.getPatternsByCategory('House');
      expect(housePatterns).toHaveLength(1);
      expect(housePatterns[0].category).toBe('House');
    });
  });

  describe('searchPatterns', () => {
    it('should return patterns matching search query', () => {
      const mockPatterns = [
        {
          id: 'test-1',
          name: 'House Beat',
          category: 'House',
          content: 'TEMPO 128\nseq kick: x...x...',
          parsedPattern: {
            tempo: 128,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'test-2',
          name: 'Techno Beat',
          category: 'Techno',
          content: 'TEMPO 130\nseq kick: x...x...',
          parsedPattern: {
            tempo: 130,
            instruments: { kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] } },
            eqModules: {},
            totalSteps: 8
          },
          complexity: 0.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      const results = PatternService.searchPatterns('house');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('House Beat');
    });
  });

  describe('getSamplePatterns', () => {
    it('should return sample patterns with correct structure', () => {
      const samplePatterns = PatternService.getSamplePatterns();
      
      expect(samplePatterns).toHaveLength(6);
      expect(samplePatterns[0]).toHaveProperty('id');
      expect(samplePatterns[0]).toHaveProperty('name');
      expect(samplePatterns[0]).toHaveProperty('category');
      expect(samplePatterns[0]).toHaveProperty('content');
      expect(samplePatterns[0]).toHaveProperty('parsedPattern');
      expect(samplePatterns[0]).toHaveProperty('complexity');
      expect(samplePatterns[0]).toHaveProperty('createdAt');
      expect(samplePatterns[0]).toHaveProperty('updatedAt');
    });
  });

  describe('initializeStorage', () => {
    it('should initialize storage with sample patterns when empty', () => {
      PatternService.initializeStorage();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const callArgs = localStorageMock.setItem.mock.calls[0];
      const savedPatterns = JSON.parse(callArgs[1]);
      expect(savedPatterns).toHaveLength(6);
    });

    it('should not initialize storage when patterns already exist', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([{ id: 'existing' }]));
      
      PatternService.initializeStorage();
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
