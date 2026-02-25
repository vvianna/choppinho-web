// 🍺 Choppinho Fit - Supabase Client
// Cliente configurado para o schema 'choppinho'

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://hlvebuymxlxhsnbbvvkc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdmVidXlteGx4aHNuYmJ2dmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDQwODcsImV4cCI6MjA3NzE4MDA4N30.67EtrPvNR-3432qGGZuwzbxtnz6TrTJ4o6hmdA-h9R4';

// Schema do banco (importante para múltiplos schemas no Supabase)
const DB_SCHEMA = 'choppinho';

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: DB_SCHEMA,
  },
  auth: {
    // Não vamos usar Supabase Auth (usamos magic link custom)
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─────────────────────────────────────────────
// Helper: Verificar se usuário está logado
// ─────────────────────────────────────────────

export const getSessionToken = (): string | null => {
  return localStorage.getItem('choppinho_session_token');
};

export const setSessionToken = (token: string): void => {
  localStorage.setItem('choppinho_session_token', token);
};

export const clearSessionToken = (): void => {
  localStorage.removeItem('choppinho_session_token');
};

export const isAuthenticated = (): boolean => {
  return !!getSessionToken();
};

// ─────────────────────────────────────────────
// Helper: Buscar usuário atual pela session
// ─────────────────────────────────────────────

export const getCurrentUser = async () => {
  const sessionToken = getSessionToken();

  if (!sessionToken) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('web_session_token', sessionToken)
      .single();

    if (error || !data) {
      // Token inválido ou expirado
      clearSessionToken();
      return null;
    }

    return data;
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    clearSessionToken();
    return null;
  }
};

// ─────────────────────────────────────────────
// Helper: Logout
// ─────────────────────────────────────────────

export const logout = async (): Promise<void> => {
  const sessionToken = getSessionToken();

  if (sessionToken) {
    // Limpar session_token no banco (via API do Cloudflare)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }

  // Limpar localStorage
  clearSessionToken();

  // Redirecionar para login
  window.location.href = '/login';
};

// ─────────────────────────────────────────────
// Exports úteis
// ─────────────────────────────────────────────

export { SUPABASE_URL, DB_SCHEMA };
