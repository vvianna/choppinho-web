/**
 * POST /api/auth/logout
 * Destrói sessão do usuário
 *
 * Recebe: Header Authorization: Bearer {session_token}
 * Retorna: { success: true }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Extrair session token do header
    const sessionToken = extractSessionToken(context.request);

    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    // Conectar ao Supabase
    const supabase = getSupabaseClient(context.env);

    // Limpar session token do usuário
    const { error } = await supabase
      .from('users')
      .update({ web_session_token: null })
      .eq('web_session_token', sessionToken);

    if (error) {
      console.error('Error clearing session token:', error);
      return errorResponse('Erro ao fazer logout', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Logout realizado com sucesso',
    });

  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
