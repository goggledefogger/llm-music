import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MIN_PASSWORD_LENGTH = 6;

/**
 * Page shown after user clicks the password reset link in their email.
 * Supabase redirects here with hash params; onAuthStateChange fires PASSWORD_RECOVERY.
 * User sets a new password via updateUser.
 */
export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-background-secondary border border-border rounded-lg p-6 text-center space-y-3">
            <p className="text-foreground font-medium">Password updated</p>
            <p className="text-sm text-foreground-muted">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-sm text-accent hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-accent">Set new password</h1>
          <p className="text-sm text-foreground-muted">
            Enter your new password below
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-background-secondary border border-border rounded-lg p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-foreground-muted">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full btn btn-sm bg-accent text-background font-medium py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};
