import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/testUtils';
import { LoginPage } from './LoginPage';

// Use vi.hoisted so the mock fn is available when vi.mock factory runs (hoisted above imports)
const { mockSignInWithOtp } = vi.hoisted(() => ({
  mockSignInWithOtp: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOtp: mockSignInWithOtp,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('ASCII Sequencer')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('disables submit button when email is empty', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /send magic link/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when email is entered', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    const button = screen.getByRole('button', { name: /send magic link/i });
    expect(button).not.toBeDisabled();
  });

  it('shows check-your-email state after successful submit', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows error on sign-in failure', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Rate limit exceeded');
    });
  });

  it('allows switching to a different email after send', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /use a different email/i }));
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });
});
