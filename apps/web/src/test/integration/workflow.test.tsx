import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { render } from '../testUtils';
import { EditorPage } from '../../pages/EditorPage';
import { mockTone } from '../sharedMocks';

// Mock Tone.js for integration tests
vi.mock('tone', () => mockTone);

describe('Complete Pattern → Audio Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete basic workflow: create pattern → validate → play → stop', async () => {
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

    await act(async () => {
      fireEvent.click(playButton);
    });

    await act(async () => {
      fireEvent.click(stopButton);
    });

    // Verify controls are still accessible
    expect(playButton).toBeInTheDocument();
    expect(stopButton).toBeInTheDocument();
  });

  it('should handle pattern changes', async () => {
    render(<EditorPage />);

    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    
    // Start with simple pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...x...x...' } });
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });

    // Change pattern
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'TEMPO 140\nseq kick: x...x...x...x...\nseq snare: ....x.......x...' } });
    });

    // Should still be valid
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });
  });
});
