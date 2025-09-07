import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternsPage } from './PatternsPage';

// Mock the PatternService with simple behavior
vi.mock('../services/patternService', () => ({
  PatternService: {
    initializeStorage: vi.fn(),
    getStoredPatterns: vi.fn(() => []),
  }
}));

// Mock the usePatternLoader hook
const mockLoadPattern = vi.fn();
vi.mock('../contexts/AppContext', () => ({
  usePatternLoader: () => ({
    loadPattern: mockLoadPattern,
  }),
}));

// Mock PatternThumbnail component
vi.mock('../components/visualizations', () => ({
  PatternThumbnail: ({ name, onClick }: any) => (
    <div>
      <h3>{name}</h3>
      <button onClick={onClick}>Load</button>
    </div>
  ),
}));

describe('PatternsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and basic structure', async () => {
    render(<PatternsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Pattern Library')).toBeInTheDocument();
    });

    expect(screen.getByText('Browse and discover patterns created by the community.')).toBeInTheDocument();
  });

  it('shows no patterns found when no patterns are available', async () => {
    render(<PatternsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No patterns found')).toBeInTheDocument();
    });

    expect(screen.getByText('No patterns are available at the moment.')).toBeInTheDocument();
  });

  it('has search and filter controls', async () => {
    render(<PatternsPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search patterns...')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
  });

  it('calls loadPattern when a pattern is loaded', async () => {
    const { PatternService } = await import('../services/patternService');
    (PatternService.getStoredPatterns as any).mockReturnValue([
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
        updatedAt: new Date('2024-01-01'),
        isPublic: true
      }
    ]);

    render(<PatternsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    });

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    expect(mockLoadPattern).toHaveBeenCalledWith('test-1');
  });

  it('renders without crashing', () => {
    render(<PatternsPage />);
    // Just test that the component renders without errors
    expect(screen.getByText('Pattern Library')).toBeInTheDocument();
  });
});
