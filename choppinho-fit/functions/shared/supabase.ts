import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase configurado para Cloudflare Functions
 * Usa SERVICE_ROLE_KEY para ter acesso total ao schema 'choppinho'
 */
export function getSupabaseClient(env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'choppinho' },
    auth: {
      persistSession: false, // Functions são stateless
      autoRefreshToken: false,
    },
  });
}
