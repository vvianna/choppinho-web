/**
 * GET /api/auth/verify?token=xxx
 * Verifica token e cria sessão
 *
 * Recebe: Query param 'token' (UUID)
 * Retorna: { success: true, user: {...}, session_token: "..." }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, type Env } from '../../_middleware';
import type { User } from '../../shared/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Extrair token da query string
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return errorResponse('Token não fornecido', 400);
    }

    // Conectar ao Supabase
    const supabase = getSupabaseClient(context.env);

    // Buscar token válido
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !authToken) {
      return errorResponse('Token inválido ou expirado', 401);
    }

    // Marcar token como usado
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('token', token);

    // Buscar ou criar usuário
    // Primeiro tenta buscar
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', authToken.phone_number)
      .single();

    if (userError || !user) {
      // Usuário não existe, criar novo
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: authToken.phone_number,
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return errorResponse('Erro ao criar usuário', 500);
      }

      user = newUser;
    }

    // Gerar novo session token (UUID)
    const sessionToken = crypto.randomUUID();

    // Atualizar session token e last_login_at
    const { error: updateError } = await supabase
      .from('users')
      .update({
        web_session_token: sessionToken,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating session token:', updateError);
      return errorResponse('Erro ao criar sessão', 500);
    }

    // Retornar usuário e session token
    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        personality_mode: user.personality_mode,
      },
      session_token: sessionToken,
    });

  } catch (error) {
    console.error('Error in /api/auth/verify:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
