import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../test/testUtils';
import { ChatInterface } from './ChatInterface';

describe('ChatInterface', () => {
  it('renders with initial assistant greeting', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/I'm your AI music assistant/)).toBeInTheDocument();
  });

  it('renders the header', () => {
    render(<ChatInterface />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Get help creating and modifying patterns')).toBeInTheDocument();
  });

  it('renders input and send button', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText('Ask about your pattern...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInterface />);
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('send button is enabled when input has text', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask about your pattern...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(screen.getByText('Send')).not.toBeDisabled();
  });

  it('sends message on button click and clears input', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask about your pattern...');
    fireEvent.change(input, { target: { value: 'Create a drum pattern' } });
    fireEvent.click(screen.getByText('Send'));

    expect(screen.getByText('Create a drum pattern')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('sends message on Enter key press', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask about your pattern...');
    fireEvent.change(input, { target: { value: 'Make it funky' } });
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 });

    expect(screen.getByText('Make it funky')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not send empty message on button click', () => {
    render(<ChatInterface />);
    const sendButton = screen.getByText('Send');
    // Button is disabled so click should not add messages
    fireEvent.click(sendButton);
    // Only the initial greeting should be present
    const messages = screen.getAllByText(/./);
    expect(screen.queryByText('user')).not.toBeInTheDocument();
  });

  it('does not send whitespace-only message', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask about your pattern...');
    fireEvent.change(input, { target: { value: '   ' } });
    // Button should still be disabled for whitespace
    expect(screen.getByText('Send')).toBeDisabled();
  });

  it('shows simulated AI response after sending message', async () => {
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Ask about your pattern...');
    fireEvent.change(input, { target: { value: 'Help me' } });
    fireEvent.click(screen.getByText('Send'));

    // Wait for the simulated AI response (1000ms setTimeout in component)
    await waitFor(() => {
      expect(screen.getByText(/Let me analyze your current code/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
