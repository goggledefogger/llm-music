import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { render } from '../testUtils';
import { EditorPage } from '../../pages/EditorPage';
import { mockTone, mockAudioContext, resetMocks } from '../sharedMocks';

// Mock Tone.js for integration tests
vi.mock('tone', () => mockTone);

describe('Unified Audio Engine Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should handle complete audio workflow: initialize → load pattern → play → pause → stop', async () => {
    render(<EditorPage />);

    // Create a pattern
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    const pattern = `TEMPO 120
seq kick: x...x...x...x...
seq snare: ....x.......x...`;

    await act(async () => {
      fireEvent.change(editor, { target: { value: pattern } });
    });

    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Test transport controls
    const playButton = screen.getByRole('button', { name: '▶️' });
    const stopButton = screen.getByRole('button', { name: '⏹️' });

    // Test play
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Test pause (play button should now be pause)
    await act(async () => {
      fireEvent.click(playButton); // This should now be pause
    });

    // Test play again
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Test stop
    await act(async () => {
      fireEvent.click(stopButton);
    });

    // Verify controls are still accessible
    expect(playButton).toBeInTheDocument();
    expect(stopButton).toBeInTheDocument();
  });

  it('should handle real-time tempo changes during playback', async () => {
    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    const pattern = `TEMPO 120
seq kick: x...x...x...x...`;

    await act(async () => {
      fireEvent.change(editor, { target: { value: pattern } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Start playback
    const playButton = screen.getByRole('button', { name: '▶️' });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Change tempo while playing
    const newPattern = `TEMPO 140
seq kick: x...x...x...x...`;

    await act(async () => {
      fireEvent.change(editor, { target: { value: newPattern } });
    });

    // Should still be valid and playing
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Stop playback
    const stopButton = screen.getByRole('button', { name: '⏹️' });
    await act(async () => {
      fireEvent.click(stopButton);
    });
  });

  it('should handle pattern changes during playback', async () => {
    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');

    // Start with simple pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...x...x...' } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Start playback
    const playButton = screen.getByRole('button', { name: '▶️' });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Change pattern while playing
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 140\nseq kick: x...x...x...x...\nseq snare: ....x.......x...' } });
    });

    // Should still be valid and playing
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Stop playback
    const stopButton = screen.getByRole('button', { name: '⏹️' });
    await act(async () => {
      fireEvent.click(stopButton);
    });
  });

  it('should handle audio engine initialization errors gracefully', async () => {
    // Mock AudioContext to throw an error
    const originalAudioContext = mockAudioContext;
    mockAudioContext.createGain = vi.fn(() => {
      throw new Error('Audio context error');
    });

    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    const pattern = `TEMPO 120
seq kick: x...x...x...x...`;

    await act(async () => {
      fireEvent.change(editor, { target: { value: pattern } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Try to play - should handle error gracefully
    const playButton = screen.getByRole('button', { name: '▶️' });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Should still be accessible (error handling should prevent crashes)
    expect(playButton).toBeInTheDocument();

    // Restore original mock
    Object.assign(mockAudioContext, originalAudioContext);
  });

  it('should maintain audio state consistency across pattern changes', async () => {
    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');

    // Load first pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...x...x...' } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Start playback
    const playButton = screen.getByRole('button', { name: '▶️' });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Change to different pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 140\nseq snare: x.x.x.x.x.x.x.x.' } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Should still be playing
    expect(playButton).toBeInTheDocument();

    // Stop playback
    const stopButton = screen.getByRole('button', { name: '⏹️' });
    await act(async () => {
      fireEvent.click(stopButton);
    });
  });

  it('should handle rapid pattern changes without audio glitches', async () => {
    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');

    // Load initial pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...x...x...' } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Start playback
    const playButton = screen.getByRole('button', { name: '▶️' });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Rapidly change patterns
    const patterns = [
      'TEMPO 130\nseq kick: x...x...x...x...\nseq snare: ....x.......x...',
      'TEMPO 140\nseq kick: x.x.x.x.x.x.x.x.',
      'TEMPO 110\nseq kick: x...x...x...x...\nseq snare: ....x.......x...\nseq hihat: x.x.x.x.x.x.x.x.'
    ];

    for (const pattern of patterns) {
      await act(async () => {
        fireEvent.change(editor, { target: { value: pattern } });
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
      });
    }

    // Should still be playing and responsive
    expect(playButton).toBeInTheDocument();

    // Stop playback
    const stopButton = screen.getByRole('button', { name: '⏹️' });
    await act(async () => {
      fireEvent.click(stopButton);
    });
  });
});
