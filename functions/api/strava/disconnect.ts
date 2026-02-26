/**
 * POST /api/strava/disconnect
 * Desconecta Strava do usuário
 *
 * Recebe: Header Authorization: Bearer {session_token}
 * Retorna: { success: true, message: "..." }
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

    // Buscar user_id pelo session token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse('Sessão inválida ou expirada', 401);
    }

    // Marcar conexão Strava como inválida
    const { error: disconnectError } = await supabase
      .from('strava_connections')
      .update({ is_valid: false })
      .eq('user_id', user.id);

    if (disconnectError) {
      console.error('Error disconnecting Strava:', disconnectError);
      return errorResponse('Erro ao desconectar Strava', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Strava desconectado com sucesso',
    });

  } catch (error) {
    console.error('Error in /api/strava/disconnect:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
