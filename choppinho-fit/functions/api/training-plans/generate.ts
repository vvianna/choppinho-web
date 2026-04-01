/**
 * POST /api/training-plans/generate
 * Proxies to choppinho backend for full AI plan generation
 */
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';
import { getSupabaseClient } from '../../shared/supabase';

interface GenerateEnv extends Env {
  CHOPPINHO_API_URL: string;
  CHOPPINHO_API_TOKEN: string;
}

export const onRequestPost: PagesFunction<GenerateEnv> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) return errorResponse('Não autenticado', 401);

    const supabase = getSupabaseClient(context.env);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) return errorResponse('Sessão inválida', 401);

    const body = await context.request.json();

    const apiUrl = context.env.CHOPPINHO_API_URL || 'http://localhost:3334';
    const apiToken = context.env.CHOPPINHO_API_TOKEN || '';

    const response = await fetch(`${apiUrl}/v1/choppinho/generate-training-plan`, {
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
      return errorResponse('Erro ao gerar plano', response.status);
    }

    const result = await response.json();
    return jsonResponse({ success: true, data: result });
  } catch (error) {
    console.error('Error in generate:', error);
    return errorResponse('Erro interno', 500);
  }
};
