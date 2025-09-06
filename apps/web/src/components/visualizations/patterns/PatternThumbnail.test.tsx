import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../test/testUtils';
import { PatternThumbnail } from './PatternThumbnail';
import { ParsedPattern } from '../../../types/app';

describe('PatternThumbnail', () => {
  const mockPattern: ParsedPattern = {
    tempo: 128,
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
    render(<PatternThumbnail pattern={mockPattern} />);
    expect(screen.getByText('Untitled Pattern')).toBeInTheDocument();
  });

  it('displays pattern name and category', () => {
    render(
      <PatternThumbnail
        pattern={mockPattern}
        name="House Beat"
        category="House"
      />
    );
    
    expect(screen.getByText('House Beat')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
  });

  it('shows complexity indicator', () => {
    const { rerender } = render(
      <PatternThumbnail
        pattern={mockPattern}
        complexity={0.2}
      />
    );
    
    expect(screen.getByText('Simple')).toBeInTheDocument();

    rerender(
      <PatternThumbnail
        pattern={mockPattern}
        complexity={0.5}
      />
    );
    
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(
      <PatternThumbnail
        pattern={mockPattern}
        complexity={0.8}
      />
    );
    
    expect(screen.getByText('Complex')).toBeInTheDocument();
  });

  it('displays pattern statistics', () => {
    render(<PatternThumbnail pattern={mockPattern} />);
    
    expect(screen.getByText('128 BPM')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows instrument visualization', () => {
    render(<PatternThumbnail pattern={mockPattern} />);
    
    // Should show instrument names
    expect(screen.getByText('kick')).toBeInTheDocument();
    expect(screen.getByText('snare')).toBeInTheDocument();
    expect(screen.getByText('hihat')).toBeInTheDocument();
  });

  it('calculates and displays pattern density', () => {
    render(<PatternThumbnail pattern={mockPattern} />);
    
    // With 4+4+16=24 active steps out of 48 total (3 instruments * 16 steps)
    // Density should be 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn();
    render(
      <PatternThumbnail
        pattern={mockPattern}
        onClick={mockOnClick}
      />
    );
    
    const thumbnail = screen.getByText('Untitled Pattern').closest('div');
    if (thumbnail) {
      fireEvent.click(thumbnail);
      expect(mockOnClick).toHaveBeenCalled();
    }
  });

  it('calls onPreview when preview button is clicked', () => {
    const mockOnPreview = vi.fn();
    render(
      <PatternThumbnail
        pattern={mockPattern}
        onPreview={mockOnPreview}
      />
    );
    
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);
    expect(mockOnPreview).toHaveBeenCalled();
  });

  it('shows load button', () => {
    render(<PatternThumbnail pattern={mockPattern} />);
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('handles patterns with many instruments', () => {
    const complexPattern: ParsedPattern = {
      tempo: 120,
      instruments: {
        kick: { name: 'kick', steps: [true, false, false, false] },
        snare: { name: 'snare', steps: [false, false, true, false] },
        hihat: { name: 'hihat', steps: [true, true, true, true] },
        bass: { name: 'bass', steps: [true, false, true, false] },
        lead: { name: 'lead', steps: [false, true, false, true] }
      },
      totalSteps: 4
    };

    render(<PatternThumbnail pattern={complexPattern} />);
    
    // Should show first 3 instruments and indicate more
    expect(screen.getByText('kick')).toBeInTheDocument();
    expect(screen.getByText('snare')).toBeInTheDocument();
    expect(screen.getByText('hihat')).toBeInTheDocument();
    expect(screen.getByText('+2 more instruments')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PatternThumbnail
        pattern={mockPattern}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles patterns with no active steps', () => {
    const emptyPattern: ParsedPattern = {
      tempo: 120,
      instruments: {
        kick: {
          name: 'kick',
          steps: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
        }
      },
      totalSteps: 16
    };

    render(<PatternThumbnail pattern={emptyPattern} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles patterns with single instrument', () => {
    const singlePattern: ParsedPattern = {
      tempo: 120,
      instruments: {
        kick: {
          name: 'kick',
          steps: [true, false, true, false]
        }
      },
      totalSteps: 4
    };

    render(<PatternThumbnail pattern={singlePattern} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 instrument
    expect(screen.getByText('4')).toBeInTheDocument(); // 4 steps
  });
});
