import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await resetPasswordForEmail(email);
    setSubmitting(false);

    if (resetError) {
      setError(resetError);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-background-secondary border border-border rounded-lg p-6 text-center space-y-3">
            <p className="text-foreground font-medium">Check your email</p>
            <p className="text-sm text-foreground-muted">
              We sent a password reset link to{' '}
              <strong className="text-foreground">{email}</strong>. Click the
              link to set a new password.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-sm text-accent hover:underline"
            >
              Back to sign in
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
          <h1 className="text-2xl font-bold text-accent">Reset password</h1>
          <p className="text-sm text-foreground-muted">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-background-secondary border border-border rounded-lg p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            disabled={submitting || !email}
            className="w-full btn btn-sm bg-accent text-background font-medium py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-foreground-muted">
            <Link to="/" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
