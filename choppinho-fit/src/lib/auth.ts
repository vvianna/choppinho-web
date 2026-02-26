/**
 * Auth helpers para gerenciar session token no frontend
 */

const SESSION_TOKEN_KEY = 'choppinho_session_token';

/**
 * Salva session token no localStorage
 */
export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Busca session token do localStorage
 */
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Remove session token do localStorage
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Verifica se usuário está autenticado (tem token)
 */
export function isAuthenticated(): boolean {
  return !!getSessionToken();
}

/**
 * Cria headers com Authorization para chamadas de API
 */
export function getAuthHeaders(): HeadersInit {
  const token = getSessionToken();

  if (!token) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
