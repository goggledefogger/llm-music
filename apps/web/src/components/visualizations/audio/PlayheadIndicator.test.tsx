import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/testUtils';
import { PlayheadIndicator } from './PlayheadIndicator';
import { ParsedPattern } from '../../../types/app';

describe('PlayheadIndicator', () => {
  const mockPattern: ParsedPattern = {
    tempo: 120,
    instruments: {
      kick: {
        name: 'kick',
        steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
      }
    },
    totalSteps: 16
  };

  it('renders without crashing', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={0}
        isPlaying={false}
        tempo={120}
      />
    );
    expect(screen.getByText('Stopped • 120 BPM')).toBeInTheDocument();
  });

  it('shows no pattern message when pattern is null', () => {
    render(
      <PlayheadIndicator
        pattern={null}
        currentTime={0}
        isPlaying={false}
        tempo={120}
      />
    );
    expect(screen.getByText('No pattern loaded')).toBeInTheDocument();
  });

  it('displays playback status correctly', () => {
    const { rerender } = render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={0}
        isPlaying={true}
        tempo={120}
      />
    );

    expect(screen.getByText('Playing • 120 BPM')).toBeInTheDocument();

    rerender(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={0}
        isPlaying={false}
        tempo={120}
      />
    );

    expect(screen.getByText('Stopped • 120 BPM')).toBeInTheDocument();
  });

  it('displays current time correctly', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={65.5}
        isPlaying={true}
        tempo={120}
      />
    );

    expect(screen.getByText('1:05.5')).toBeInTheDocument();
  });

  it('displays current step and beat position', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={120}
      />
    );

    // At 1.0s with 120 BPM and 4 steps/beat: 8 steps → index 8 → display 9
    // Check the "Current Step" display specifically
    expect(screen.getByText('Current Step:')).toBeInTheDocument();
    const currentStepDisplay = screen.getByText('Current Step:').parentElement?.querySelector('.font-mono');
    expect(currentStepDisplay).toHaveTextContent('9');
  });

  it('shows pattern loop information', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={120}
      />
    );

    // At 1.0s: step index 8 → display 9
    expect(screen.getByText('Pattern Loop: 9/16')).toBeInTheDocument();
  });

  it('displays progress bar', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={120}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('16 steps')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={0}
        isPlaying={false}
        tempo={120}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles different tempos correctly', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={0}
        isPlaying={false}
        tempo={140}
      />
    );

    expect(screen.getByText('Stopped • 140 BPM')).toBeInTheDocument();
  });

  it('calculates step position correctly for different tempos', () => {
    const { rerender } = render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={120}
      />
    );

    // At 120 BPM, 1 second = 2 beats = 8 steps
    // Check the "Current Step" display specifically
    expect(screen.getByText('Current Step:')).toBeInTheDocument();
    const currentStepDisplay = screen.getByText('Current Step:').parentElement?.querySelector('.font-mono');
    expect(currentStepDisplay).toHaveTextContent('9'); // Step 9 (0-indexed)

    rerender(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={60}
      />
    );

    // At 60 BPM, 1 second = 1 beat = 4 steps
    const currentStepDisplay2 = screen.getByText('Current Step:').parentElement?.querySelector('.font-mono');
    expect(currentStepDisplay2).toHaveTextContent('5'); // Step 5 (0-indexed)
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

    render(
      <PlayheadIndicator
        pattern={shortPattern}
        currentTime={0.5}
        isPlaying={true}
        tempo={120}
      />
    );

    // The component shows at least 16 steps; at 0.5s: 4 steps → index 4 → display 5
    expect(screen.getByText('Pattern Loop: 5/16')).toBeInTheDocument();
    expect(screen.getByText('16 steps')).toBeInTheDocument();
  });
});
