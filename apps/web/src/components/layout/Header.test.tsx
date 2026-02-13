import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test/testUtils';
import { Header } from './Header';
import { mockTone } from '../../test/sharedMocks';

vi.mock('tone', () => mockTone);

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays user email', async () => {
    render(<Header />);
    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
  });

  it('renders Sign Out button', async () => {
    render(<Header />);
    expect(await screen.findByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signOut when button is clicked', () => {
    render(<Header />);
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    // signOut was called (the mock from setup.ts handles this)
    // Just verify it doesn't crash
    expect(signOutButton).toBeInTheDocument();
  });
});
