// 🍺 Choppinho Fit - API Helpers
// Funções para chamar as Cloudflare Functions

import type {
  AuthResponse,
  VerifyTokenResponse,
  UserProfile,
  DashboardStats,
  NotificationPreferences,
} from './types';

// ─────────────────────────────────────────────
// Base URL das APIs (Cloudflare Functions)
// ─────────────────────────────────────────────

const API_BASE_URL = '/api';

// Helper para fazer requests com headers padrão
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const sessionToken = localStorage.getItem('choppinho_session_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Erro desconhecido',
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ─────────────────────────────────────────────
// AUTH: Autenticação via Magic Link
// ─────────────────────────────────────────────

/**
 * Solicita magic link para o telefone
 * POST /api/auth/request
 */
export const requestMagicLink = async (
  phoneNumber: string
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>('/auth/request', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
};

/**
 * Verifica token do magic link
 * GET /api/auth/verify?token=xxx
 */
export const verifyMagicLink = async (
  token: string
): Promise<VerifyTokenResponse> => {
  return apiRequest<VerifyTokenResponse>(`/auth/verify?token=${token}`, {
    method: 'GET',
  });
};

/**
 * Faz logout do usuário
 * POST /api/auth/logout
 */
export const logoutUser = async (): Promise<void> => {
  await apiRequest('/auth/logout', {
    method: 'POST',
  });
};

// ─────────────────────────────────────────────
// USER: Perfil e preferências
// ─────────────────────────────────────────────

/**
 * Busca perfil completo do usuário
 * GET /api/user/profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  return apiRequest<UserProfile>('/user/profile', {
    method: 'GET',
  });
};

/**
 * Atualiza preferências de notificação
 * PUT /api/user/preferences
 */
export const updatePreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean }> => {
  return apiRequest('/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

// ─────────────────────────────────────────────
// STATS: Estatísticas do dashboard
// ─────────────────────────────────────────────

/**
 * Busca estatísticas agregadas para o dashboard
 * GET /api/stats/dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return apiRequest<DashboardStats>('/stats/dashboard', {
    method: 'GET',
  });
};

// ─────────────────────────────────────────────
// STRAVA: Gerenciar conexão
// ─────────────────────────────────────────────

/**
 * Gera URL de autorização do Strava
 * Não é uma chamada de API, apenas helper para gerar a URL
 */
export const getStravaAuthUrl = (userId: string): string => {
  const params = new URLSearchParams({
    client_id: '151164',
    redirect_uri: 'https://webhook.vvmbrrj.com.br/webhook/strava-callback',
    state: userId, // UUID do usuário
    response_type: 'code',
    approval_prompt: 'force',
    scope: 'read,activity:read_all',
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

/**
 * Desconecta Strava (marca is_valid = false)
 * POST /api/strava/disconnect
 */
export const disconnectStrava = async (): Promise<{ success: boolean }> => {
  return apiRequest('/strava/disconnect', {
    method: 'POST',
  });
};

// ─────────────────────────────────────────────
// SUBSCRIPTION: Gerenciar planos (Fase futura)
// ─────────────────────────────────────────────

/**
 * Busca status da assinatura
 * GET /api/subscription/status
 */
export const getSubscriptionStatus = async (): Promise<{
  plan: string;
  status: string;
  expires_at: string | null;
}> => {
  return apiRequest('/subscription/status', {
    method: 'GET',
  });
};

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────

export default {
  requestMagicLink,
  verifyMagicLink,
  logoutUser,
  getUserProfile,
  updatePreferences,
  getDashboardStats,
  getStravaAuthUrl,
  disconnectStrava,
  getSubscriptionStatus,
};
