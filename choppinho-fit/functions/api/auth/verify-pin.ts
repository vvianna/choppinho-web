/**
 * POST /api/auth/verify-pin
 * Verifica código PIN de 6 dígitos e cria sessão
 *
 * Recebe: { phone_number: "+5521967076547", pin_code: "748392" }
 * Retorna: { success: true, user: {...}, session_token: "..." }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, type Env } from '../../_middleware';
import type { User } from '../../shared/types';

interface RequestBody {
  phone_number: string;
  pin_code: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse body
    const body = await context.request.json() as RequestBody;
    const { phone_number, pin_code } = body;

    // Validar formato
    if (!phone_number || !pin_code) {
      return errorResponse('Telefone e código PIN são obrigatórios', 400);
    }

    // Validar formato do PIN (6 dígitos)
    if (!/^\d{6}$/.test(pin_code)) {
      return errorResponse('Código PIN inválido. Deve conter 6 dígitos.', 400);
    }

    // Conectar ao Supabase
    const supabase = getSupabaseClient(context.env);

    // Buscar token válido pelo phone_number e pin_code
    const { data: authToken, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('pin_code', pin_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !authToken) {
      return errorResponse('Código inválido ou expirado', 401);
    }

    // Marcar token como usado
    await supabase
      .from('auth_tokens')
      .update({ used: true })
      .eq('id', authToken.id);

    // Buscar ou criar usuário
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
    console.error('Error in /api/auth/verify-pin:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
