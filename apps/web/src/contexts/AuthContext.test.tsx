import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test/testUtils';
import { useAuth } from './AuthContext';

// The global mock from setup.ts provides an authenticated session by default.
// Tests here verify that the AuthProvider correctly exposes that state.

function AuthStatus() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  return <div>Authenticated as {user.email}</div>;
}

describe('AuthContext', () => {
  it('provides user info when session exists', async () => {
    render(<AuthStatus />);
    await waitFor(() => {
      expect(screen.getByText(/Authenticated as test@example.com/)).toBeInTheDocument();
    });
  });

  it('throws when useAuth is used outside AuthProvider', async () => {
    // Render without the provider wrapper
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { render: rawRender } = await import('@testing-library/react');
    expect(() => {
      rawRender(<AuthStatus />);
    }).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
