/**
 * GET /api/strava/debug
 * Endpoint de debug para verificar configuração e conexão Strava
 *
 * Headers: Authorization: Bearer {session_token}
 * Retorna informações detalhadas sobre a conexão e webhook
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
      .select('id, email, name, created_at')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse('Sessão inválida ou expirada', 401);
    }

    // Buscar conexão Strava
    const { data: stravaConnection, error: stravaError } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Informações do webhook
    const webhookUrl = context.env.N8N_WEBHOOK_STRAVA_SYNC;

    // Testar webhook (apenas ping, sem payload real)
    let webhookTest = null;
    if (webhookUrl) {
      try {
        const testStart = Date.now();
        const testResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
          }),
        });
        const testEnd = Date.now();

        webhookTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
          response_time_ms: testEnd - testStart,
          headers: Object.fromEntries(testResponse.headers.entries()),
        };

        // Tentar ler o body
        try {
          const responseText = await testResponse.text();
          webhookTest.body = responseText;
          try {
            webhookTest.json = JSON.parse(responseText);
          } catch (e) {
            // Não é JSON
          }
        } catch (e) {
          webhookTest.body_error = 'Failed to read response body';
        }
      } catch (error: any) {
        webhookTest = {
          error: error.message,
          type: error.name,
        };
      }
    }

    return jsonResponse({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        strava_connection: stravaConnection ? {
          connected: true,
          athlete_id: stravaConnection.strava_athlete_id,
          is_valid: stravaConnection.is_valid,
          token_expires_at: stravaConnection.token_expires_at,
          created_at: stravaConnection.created_at,
          updated_at: stravaConnection.updated_at,
          token_expired: new Date(stravaConnection.token_expires_at) < new Date(),
          has_access_token: !!stravaConnection.access_token,
          has_refresh_token: !!stravaConnection.refresh_token,
        } : {
          connected: false,
          error: stravaError?.message || 'No connection found',
        },
        webhook: {
          configured: !!webhookUrl,
          url: webhookUrl || 'NOT SET',
          test: webhookTest,
        },
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Error in GET /api/strava/debug:', error);
    return errorResponse('Erro ao debugar: ' + error.message, 500);
  }
};
