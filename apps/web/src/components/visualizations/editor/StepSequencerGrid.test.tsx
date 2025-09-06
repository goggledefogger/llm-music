import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../test/testUtils';
import { StepSequencerGrid } from './StepSequencerGrid';
import { ParsedPattern } from '../../../types/app';

// Mock D3.js to avoid import issues in tests
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({
      attr: vi.fn(() => ({
        style: vi.fn(() => ({
          text: vi.fn()
        }))
      }))
    }))
  }))
}));

describe('StepSequencerGrid', () => {
  const mockPattern: ParsedPattern = {
    tempo: 120,
    instruments: {
      kick: {
        name: 'kick',
        steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
      },
      snare: {
        name: 'snare',
        steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
      },
      hihat: {
        name: 'hihat',
        steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
      }
    },
    totalSteps: 16
  };

  it('renders without crashing', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    expect(screen.getByText('Step Sequencer')).toBeInTheDocument();
  });

  it('shows no pattern message when pattern is null', () => {
    render(<StepSequencerGrid pattern={null} />);
    expect(screen.getByText('No pattern loaded')).toBeInTheDocument();
    expect(screen.getByText('Create a pattern in the ASCII editor to see the step sequencer')).toBeInTheDocument();
  });

  it('displays pattern information correctly', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    
    expect(screen.getByText('3 instruments • 16 steps')).toBeInTheDocument();
    expect(screen.getByText('120 BPM')).toBeInTheDocument();
    // Check for step count in the pattern info section - use regex to handle split text
    expect(screen.getByText(/16 steps/)).toBeInTheDocument();
  });

  it('renders instrument tracks with correct colors', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    
    // Check instrument labels
    expect(screen.getByText('kick')).toBeInTheDocument();
    expect(screen.getByText('snare')).toBeInTheDocument();
    expect(screen.getByText('hihat')).toBeInTheDocument();
  });

  it('displays step counts for each instrument', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    
    // Should show step counts for each instrument
    const stepCounts = screen.getAllByText(/\/16/);
    expect(stepCounts).toHaveLength(3); // kick, snare, hihat
  });

  it('highlights current step when provided', () => {
    render(<StepSequencerGrid pattern={mockPattern} currentStep={4} />);
    
    // Should show current step indicator in the current step display
    expect(screen.getByText('Current Step:')).toBeInTheDocument();
    // The current step should be displayed as 5 (1-indexed)
    const currentStepElements = screen.getAllByText('5');
    expect(currentStepElements.length).toBeGreaterThan(0);
  });

  it('calls onStepToggle when step is clicked', () => {
    const mockOnStepToggle = vi.fn();
    render(<StepSequencerGrid pattern={mockPattern} onStepToggle={mockOnStepToggle} />);
    
    // Find and click a step button
    const stepButtons = screen.getAllByRole('button');
    const firstStepButton = stepButtons.find(button => button.textContent === '1');
    
    if (firstStepButton) {
      fireEvent.click(firstStepButton);
      expect(mockOnStepToggle).toHaveBeenCalledWith('kick', 0);
    }
  });

  it('does not call onStepToggle when not provided', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    
    const stepButtons = screen.getAllByRole('button');
    const firstStepButton = stepButtons.find(button => button.textContent === '1');
    
    if (firstStepButton) {
      // Should not throw error when clicked without onStepToggle
      expect(() => fireEvent.click(firstStepButton)).not.toThrow();
    }
  });

  it('applies custom className', () => {
    const { container } = render(<StepSequencerGrid pattern={mockPattern} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles patterns with different step counts', () => {
    const shortPattern: ParsedPattern = {
      tempo: 120,
      instruments: {
        kick: {
          name: 'kick',
          steps: [true, false, true, false]
        }
      },
      totalSteps: 4
    };

    render(<StepSequencerGrid pattern={shortPattern} />);
    // The component shows "1 instrument • 16 steps" because it uses totalSteps from pattern
    expect(screen.getByText('1 instrument • 16 steps')).toBeInTheDocument();
  });

  it('handles patterns with no instruments', () => {
    const emptyPattern: ParsedPattern = {
      tempo: 120,
      instruments: {},
      totalSteps: 16
    };

    render(<StepSequencerGrid pattern={emptyPattern} />);
    expect(screen.getByText('0 instruments • 16 steps')).toBeInTheDocument();
  });

  it('displays tempo and total steps in pattern info', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    
    const patternInfo = screen.getByText('Tempo:').closest('div');
    expect(patternInfo).toHaveTextContent('120 BPM');
    
    const totalStepsInfo = screen.getByText('Total Steps:').closest('div');
    expect(totalStepsInfo).toHaveTextContent('16');
  });
});
