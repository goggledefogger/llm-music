import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Verify the Supabase auth token from the Authorization header.
 * Uses the Supabase Admin client to validate the token server-side.
 * Returns the user on success, or null if invalid/missing.
 */
export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[auth] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.warn('[auth] Token verification failed:', error?.message);
      return null;
    }
    return { id: user.id, email: user.email };
  } catch (err) {
    console.warn('[auth] Auth check failed:', (err as Error).message);
    return null;
  }
}
