/**
 * Middleware global para Cloudflare Functions
 * - Adiciona headers CORS
 * - Fornece helpers de autenticação
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  N8N_WEBHOOK_MAGIC_LINK: string;
  ENVIRONMENT: string;
}

/**
 * Adiciona headers CORS a todas as respostas
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next();

  // Clone response para modificar headers
  const newResponse = new Response(response.body, response);

  // Adicionar CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: newResponse.headers,
    });
  }

  return newResponse;
};

/**
 * Helper: Extrai session token do header Authorization
 */
export function extractSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer "
}

/**
 * Helper: Cria resposta JSON com headers corretos
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Helper: Cria resposta de erro padronizada
 */
export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}
