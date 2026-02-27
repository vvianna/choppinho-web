/**
 * POST /api/strava/sync
 * Dispara sincronização das atividades do Strava via webhook N8N
 *
 * Headers: Authorization: Bearer {session_token}
 * Retorna: { success, message, activities_synced }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    // Buscar conexão Strava válida
    const { data: stravaConnection, error: stravaError } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .single();

    if (stravaError || !stravaConnection) {
      return errorResponse('Strava não está conectado', 400);
    }

    // Verificar se tem webhook configurado
    const webhookUrl = context.env.N8N_WEBHOOK_STRAVA_SYNC;

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_STRAVA_SYNC not configured');
      return errorResponse('Webhook de sincronização não configurado', 500);
    }

    // Calcular data de sync (pegar atividades dos últimos 30 dias)
    const syncSince = new Date();
    syncSince.setDate(syncSince.getDate() - 30);

    // Chamar webhook N8N
    const webhookPayload = {
      user_id: user.id,
      strava_athlete_id: stravaConnection.strava_athlete_id,
      strava_access_token: stravaConnection.access_token,
      strava_refresh_token: stravaConnection.refresh_token,
      token_expires_at: stravaConnection.token_expires_at,
      sync_since: syncSince.toISOString(),
    };

    console.log('Calling N8N webhook for Strava sync:', {
      user_id: user.id,
      athlete_id: stravaConnection.strava_athlete_id,
    });

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('N8N webhook failed:', errorText);
      return errorResponse('Erro ao sincronizar com Strava. Tente novamente.', 500);
    }

    const webhookData = await webhookResponse.json();

    console.log('N8N webhook response:', webhookData);

    return jsonResponse({
      success: true,
      message: 'Sincronização iniciada com sucesso!',
      data: {
        activities_synced: webhookData.activities_synced || 0,
        activities_new: webhookData.activities_new || 0,
        activities_updated: webhookData.activities_updated || 0,
        last_activity_date: webhookData.last_activity_date || null,
      },
    });

  } catch (error: any) {
    console.error('Error in POST /api/strava/sync:', error);
    return errorResponse('Erro ao sincronizar: ' + error.message, 500);
  }
};
