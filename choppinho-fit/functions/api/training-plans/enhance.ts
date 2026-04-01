/**
 * POST /api/training-plans/enhance
 * Proxies to choppinho backend for AI enhancement
 */
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';
import { getSupabaseClient } from '../../shared/supabase';

interface EnhanceEnv extends Env {
  CHOPPINHO_API_URL: string;
  CHOPPINHO_API_TOKEN: string;
}

export const onRequestPost: PagesFunction<EnhanceEnv> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) return errorResponse('Não autenticado', 401);

    // Verify user session
    const supabase = getSupabaseClient(context.env);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) return errorResponse('Sessão inválida', 401);

    const body = await context.request.json();

    // Call choppinho backend
    const apiUrl = context.env.CHOPPINHO_API_URL || 'http://localhost:3334';
    const apiToken = context.env.CHOPPINHO_API_TOKEN || '';

    const response = await fetch(`${apiUrl}/v1/choppinho/enhance-training-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return errorResponse('Erro ao gerar insights', response.status);
    }

    const result = await response.json();
    return jsonResponse({ success: true, data: result });
  } catch (error) {
    console.error('Error in enhance:', error);
    return errorResponse('Erro interno', 500);
  }
};
