/**
 * GET /api/strava/status
 * Retorna status da conexão Strava do usuário
 *
 * Headers: Authorization: Bearer {session_token}
 * Retorna: { connected, athlete_id, last_sync, total_activities }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);

    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    const supabase = getSupabaseClient(context.env);

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse('Sessão inválida ou expirada', 401);
    }

    // Buscar conexão Strava
    const { data: stravaConnection } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .single();

    if (!stravaConnection) {
      return jsonResponse({
        success: true,
        data: {
          connected: false,
          athlete_id: null,
          last_sync: null,
          total_activities: 0,
        },
      });
    }

    // Contar atividades do usuário
    const { count: totalActivities } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Buscar última atividade para saber quando foi o último sync
    const { data: lastActivity } = await supabase
      .from('activities')
      .select('synced_at')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    return jsonResponse({
      success: true,
      data: {
        connected: true,
        athlete_id: stravaConnection.strava_athlete_id,
        connected_at: stravaConnection.connected_at,
        last_sync: lastActivity?.synced_at || stravaConnection.connected_at,
        total_activities: totalActivities || 0,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/strava/status:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
