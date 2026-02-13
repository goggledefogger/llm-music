import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/testUtils';
import { LoginPage } from './LoginPage';
import { supabase } from '../lib/supabase';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: {} as any, session: {} as any },
      error: null,
    });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('ASCII Sequencer')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('disables submit button when email or password is empty', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when email and password are entered', () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).not.toBeDisabled();
  });

  it('shows error on sign-in failure', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' } as any,
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials');
    });
  });

  it('has link to sign up page', () => {
    render(<LoginPage />);
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/auth/signup');
  });

  it('has link to forgot password page', () => {
    render(<LoginPage />);
    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
  });
});
