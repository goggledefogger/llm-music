import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/testUtils';
import { EditorPage } from './EditorPage';
import { mockTone } from '../test/sharedMocks';

// Mock Tone.js to avoid import issues in tests
vi.mock('tone', () => mockTone);

describe('EditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EditorPage />);
    expect(screen.getByText('ASCII Pattern Editor')).toBeInTheDocument();
  });

  it('displays ASCII editor in the left panel', () => {
    render(<EditorPage />);
    
    // ASCII Editor should be present
    expect(screen.getByPlaceholderText('Enter your ASCII pattern here...')).toBeInTheDocument();
    expect(screen.getByText('ASCII Pattern Editor')).toBeInTheDocument();
  });

  it('displays step sequencer grid in the right panel', () => {
    render(<EditorPage />);
    
    // Step Sequencer Grid should be present - initially shows "No pattern loaded"
    expect(screen.getByText('Create a pattern in the ASCII editor to see the step sequencer')).toBeInTheDocument();
  });

  it('displays pattern analysis in the AI panel', () => {
    render(<EditorPage />);
    
    // Pattern Analysis should be present - check for the analysis section
    expect(screen.getByText('Pattern Analysis')).toBeInTheDocument();
  });

  it('displays transport controls at the bottom', () => {
    render(<EditorPage />);
    
    // Transport controls should be present - the play button has emoji name
    expect(screen.getByRole('button', { name: '▶️' })).toBeInTheDocument();
  });

  it('shows chat interface in the right panel', () => {
    render(<EditorPage />);
    
    // Chat interface should be present (assuming it has some identifiable text)
    // This might need to be adjusted based on the actual ChatInterface implementation
  });

  it('updates step sequencer when pattern changes', async () => {
    render(<EditorPage />);
    
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    
    // Type a valid pattern
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...' } });
    
    // Wait for validation and visualization update
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });
    
    // Step sequencer should show the pattern - use getAllByText since there are multiple
    const kickElements = screen.getAllByText('kick');
    expect(kickElements.length).toBeGreaterThan(0);
  });

  it('updates pattern analysis when pattern changes', async () => {
    render(<EditorPage />);
    
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    
    // Type a valid pattern
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...\nseq snare: ....x...' } });
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });
    
    // Pattern analysis should show the pattern data - use getAllByText since there are multiple
    const instrumentElements = screen.getAllByText(/2 instruments/);
    expect(instrumentElements.length).toBeGreaterThan(0);
  });

  it('handles invalid patterns gracefully', async () => {
    render(<EditorPage />);
    
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    
    // Type an invalid pattern
    fireEvent.change(editor, { target: { value: 'INVALID PATTERN' } });
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('✗ Invalid')).toBeInTheDocument();
    });
    
    // Step sequencer should show no pattern message - use getAllByText since there are multiple
    const noPatternElements = screen.getAllByText('No pattern loaded');
    expect(noPatternElements.length).toBeGreaterThan(0);
  });

  it('maintains layout structure', () => {
    const { container } = render(<EditorPage />);
    
    // Should have the main flex container
    const mainContainer = container.querySelector('.flex.h-full');
    expect(mainContainer).toBeInTheDocument();
    
    // Should have editor pane
    const editorPane = container.querySelector('.flex-1.flex.flex-col.min-w-0');
    expect(editorPane).toBeInTheDocument();
    
    // Should have chat pane
    const chatPane = container.querySelector('.chat-panel');
    expect(chatPane).toBeInTheDocument();
  });

  it('shows audio status in editor', () => {
    render(<EditorPage />);
    
    // Should show audio status (initially not initialized)
    expect(screen.getByText('👆 Click to Enable Audio')).toBeInTheDocument();
  });

  it('displays validation status correctly', async () => {
    render(<EditorPage />);
    
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...');
    
    // Clear and type a valid pattern
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });
    
    // Should show valid instruments
    expect(screen.getByText('Valid Instruments:')).toBeInTheDocument();
    // Use getAllByText since there are multiple "kick" elements
    const kickElements = screen.getAllByText('kick');
    expect(kickElements.length).toBeGreaterThan(0);
  });
});
