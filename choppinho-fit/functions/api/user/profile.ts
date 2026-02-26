/**
 * GET /api/user/profile
 * Busca perfil completo do usuário
 *
 * Recebe: Header Authorization: Bearer {session_token}
 * Retorna: { user: {...}, strava_connection: {...}, notification_preferences: {...} }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Extrair session token do header
    const sessionToken = extractSessionToken(context.request);

    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    // Conectar ao Supabase
    const supabase = getSupabaseClient(context.env);

    // Buscar usuário pelo session token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse('Sessão inválida ou expirada', 401);
    }

    // Buscar conexão Strava (se houver)
    const { data: stravaConnection } = await supabase
      .from('strava_connections')
      .select('id, strava_athlete_id, connected_at, is_valid')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .single();

    // Buscar preferências de notificação
    const { data: notificationPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return jsonResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          phone_number: user.phone_number,
          name: user.name,
          is_active: user.is_active,
          subscription_plan: user.subscription_plan,
          subscription_status: user.subscription_status,
          subscription_started_at: user.subscription_started_at,
          subscription_expires_at: user.subscription_expires_at,
          personality_mode: user.personality_mode,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
        },
        strava_connection: stravaConnection || null,
        notification_preferences: notificationPreferences || null,
      },
    });

  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
