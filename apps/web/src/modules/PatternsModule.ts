// Patterns Module for the ASCII Generative Sequencer
import React from 'react';
import { BaseModule } from '../core/BaseModule';
import { PatternsModuleData, SavedPattern, PatternCategory, ParsedPattern } from '../types/module';
import { PatternParser } from '../services/patternParser';

export class PatternsModule extends BaseModule {
  private patterns: SavedPattern[] = [];
  private categories: PatternCategory[] = [
    {
      id: 'default',
      name: 'All Patterns',
      description: 'All saved patterns',
      color: '#3b82f6',
      patternIds: []
    },
    {
      id: 'drums',
      name: 'Drum Patterns',
      description: 'Drum-focused patterns',
      color: '#ef4444',
      patternIds: []
    },
    {
      id: 'electronic',
      name: 'Electronic',
      description: 'Electronic music patterns',
      color: '#8b5cf6',
      patternIds: []
    }
  ];
  private searchQuery: string = '';
  private selectedPattern: string | null = null;

  constructor() {
    super('patterns', 'Pattern Library', 'Pattern storage, organization, and sharing', {
      canVisualize: true,
      canExport: true,
      canImport: true,
      canShare: true,
      canAnalyze: true
    });

    this.metadata.visualization = {
      type: 'thumbnail',
      component: 'PatternsVisualization',
      props: {
        showThumbnails: true,
        showCategories: true,
        showSearch: true,
        showMetadata: true
      },
      responsive: true,
      realTime: false
    };

    // Initialize with some sample patterns
    this.initializeSamplePatterns();
  }

  protected getInitialData(): PatternsModuleData {
    return {
      patterns: this.patterns,
      categories: this.categories,
      searchQuery: this.searchQuery,
      selectedPattern: this.selectedPattern
    };
  }

  protected getModuleData(): PatternsModuleData {
    return {
      patterns: this.patterns,
      categories: this.categories,
      searchQuery: this.searchQuery,
      selectedPattern: this.selectedPattern
    };
  }

  protected async onInitialize(): Promise<void> {
    // Load patterns from storage (localStorage, API, etc.)
    await this.loadPatternsFromStorage();
    this.updateCategoryPatternIds();
  }

  protected onDataUpdate(newData: Partial<PatternsModuleData>): void {
    if (newData.patterns !== undefined) {
      this.patterns = newData.patterns;
      this.updateCategoryPatternIds();
    }

    if (newData.categories !== undefined) {
      this.categories = newData.categories;
    }

    if (newData.searchQuery !== undefined) {
      this.searchQuery = newData.searchQuery;
    }

    if (newData.selectedPattern !== undefined) {
      this.selectedPattern = newData.selectedPattern;
    }
  }

  protected onVisualizationUpdate(data: any): void {
    // Handle visualization updates (e.g., pattern selection, category filtering)
    if (data.selectPattern) {
      this.selectPattern(data.selectPattern.id);
    }

    if (data.filterCategory) {
      this.filterByCategory(data.filterCategory.id);
    }

    if (data.search) {
      this.searchPatterns(data.search.query);
    }
  }

  renderVisualization(): React.ReactElement {
    return React.createElement('div', {
      className: 'patterns-visualization',
      'data-module': 'patterns'
    }, 'Patterns Visualization Placeholder');
  }

  // Patterns-specific methods
  savePattern(name: string, content: string, tags: string[] = []): string {
    try {
      const parsedPattern = PatternParser.parse(content);
      const pattern: SavedPattern = {
        id: this.generatePatternId(),
        name,
        content,
        pattern: parsedPattern,
        metadata: {
          tempo: parsedPattern.tempo,
          complexity: this.calculateComplexity(parsedPattern),
          tags,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      this.patterns.push(pattern);
      this.updateCategoryPatternIds();
      this.savePatternsToStorage();
      this.setState({ lastUpdated: new Date() });

      return pattern.id;
    } catch (error) {
      throw new Error(`Failed to save pattern: ${error}`);
    }
  }

  deletePattern(id: string): void {
    this.patterns = this.patterns.filter(p => p.id !== id);
    this.updateCategoryPatternIds();
    this.savePatternsToStorage();

    if (this.selectedPattern === id) {
      this.selectedPattern = null;
    }

    this.setState({ lastUpdated: new Date() });
  }

  getPattern(id: string): SavedPattern | null {
    return this.patterns.find(p => p.id === id) || null;
  }

  getPatterns(): SavedPattern[] {
    return [...this.patterns];
  }

  getFilteredPatterns(): SavedPattern[] {
    let filtered = this.patterns;

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(pattern =>
        pattern.name.toLowerCase().includes(query) ||
        pattern.content.toLowerCase().includes(query) ||
        pattern.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  getCategories(): PatternCategory[] {
    return [...this.categories];
  }

  selectPattern(id: string): void {
    this.selectedPattern = id;
    this.setState({ lastUpdated: new Date() });
  }

  searchPatterns(query: string): void {
    this.searchQuery = query;
    this.setState({ lastUpdated: new Date() });
  }

  filterByCategory(_categoryId: string): void {
    // This would filter patterns by category
    // Implementation depends on how categories are used
    this.setState({ lastUpdated: new Date() });
  }

  createCategory(name: string, description: string, color: string): string {
    const category: PatternCategory = {
      id: this.generateCategoryId(),
      name,
      description,
      color,
      patternIds: []
    };

    this.categories.push(category);
    this.setState({ lastUpdated: new Date() });

    return category.id;
  }

  private initializeSamplePatterns(): void {
    const samplePatterns = [
      {
        name: 'Basic Beat',
        content: `TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`,
        tags: ['basic', 'drums', 'beginner']
      },
      {
        name: 'Funk Groove',
        content: `TEMPO 110

seq kick: x..x.x..x..x.x..
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`,
        tags: ['funk', 'groove', 'intermediate']
      },
      {
        name: 'Electronic Beat',
        content: `TEMPO 128

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`,
        tags: ['electronic', 'edm', 'fast']
      }
    ];

    samplePatterns.forEach(sample => {
      try {
        this.savePattern(sample.name, sample.content, sample.tags);
      } catch (error) {
        console.error('Failed to create sample pattern:', error);
      }
    });
  }

  private updateCategoryPatternIds(): void {
    this.categories.forEach(category => {
      if (category.id === 'default') {
        category.patternIds = this.patterns.map(p => p.id);
      } else if (category.id === 'drums') {
        category.patternIds = this.patterns
          .filter(p => p.metadata.tags.includes('drums'))
          .map(p => p.id);
      } else if (category.id === 'electronic') {
        category.patternIds = this.patterns
          .filter(p => p.metadata.tags.includes('electronic'))
          .map(p => p.id);
      }
    });
  }

  private calculateComplexity(pattern: ParsedPattern): number {
    // Simple complexity calculation based on pattern density and variation
    let totalSteps = 0;
    let activeSteps = 0;

    Object.values(pattern.instruments).forEach(instrument => {
      totalSteps += instrument.steps.length;
      activeSteps += instrument.steps.filter(step => step).length;
    });

    const density = totalSteps > 0 ? activeSteps / totalSteps : 0;
    return Math.round(density * 100);
  }

  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCategoryId(): string {
    return `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadPatternsFromStorage(): Promise<void> {
    // Load patterns from localStorage or API
    try {
      const stored = localStorage.getItem('ascii-sequencer-patterns');
      if (stored) {
        const parsedPatterns = JSON.parse(stored);
        this.patterns = parsedPatterns.map((p: any) => ({
          ...p,
          metadata: {
            ...p.metadata,
            createdAt: new Date(p.metadata.createdAt),
            updatedAt: new Date(p.metadata.updatedAt)
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load patterns from storage:', error);
    }
  }

  private savePatternsToStorage(): void {
    // Save patterns to localStorage or API
    try {
      localStorage.setItem('ascii-sequencer-patterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Failed to save patterns to storage:', error);
    }
  }
}
