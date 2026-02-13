import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Handles auth redirects: email confirmation after signup, OAuth callbacks.
 * Supabase exchanges URL hash/params for a session. For PASSWORD_RECOVERY,
 * redirect to reset-password page so user can set a new password.
 */
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          navigate('/', { replace: true });
        } else if (event === 'PASSWORD_RECOVERY') {
          navigate('/auth/reset-password', { replace: true });
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-foreground-muted">Signing you in...</p>
      </div>
    </div>
  );
};
