import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-accent">ASCII Sequencer</h1>
          <p className="text-sm text-foreground-muted">
            Sign in to start making music
          </p>
        </div>

        {sent ? (
          <div className="bg-background-secondary border border-border rounded-lg p-6 text-center space-y-3">
            <p className="text-foreground font-medium">Check your email</p>
            <p className="text-sm text-foreground-muted">
              We sent a magic link to <strong className="text-foreground">{email}</strong>.
              Click the link in the email to sign in.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-4"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-background-secondary border border-border rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full btn btn-sm bg-accent text-background font-medium py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
