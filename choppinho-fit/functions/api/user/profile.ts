/**
 * GET /api/user/profile - Busca perfil completo do usuário
 * PUT /api/user/profile - Atualiza perfil do usuário
 *
 * Recebe: Header Authorization: Bearer {session_token}
 * Retorna: { user: {...}, strava_connection: {...}, notification_preferences: {...} }
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

interface UpdateProfileBody {
  first_name?: string;
  email?: string;
  nicknames?: string[];
  personality_mode?: 'default' | 'offensive' | 'light_zen';
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  city?: string | null;
}

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
          first_name: user.first_name,
          email: user.email,
          name: user.name,
          is_active: user.is_active,
          subscription_plan: user.subscription_plan,
          subscription_status: user.subscription_status,
          subscription_started_at: user.subscription_started_at,
          subscription_expires_at: user.subscription_expires_at,
          personality_mode: user.personality_mode,
          nicknames: user.nicknames || [],
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

// PUT - Atualizar perfil
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);

    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    // Parse body
    const body = await context.request.json() as UpdateProfileBody;

    // Validações
    const errors: string[] = [];

    if (body.first_name !== undefined) {
      if (typeof body.first_name !== 'string' || body.first_name.length > 100) {
        errors.push('Nome deve ter no máximo 100 caracteres');
      }
    }

    if (body.email !== undefined) {
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        errors.push('Email inválido');
      }
    }

    if (body.nicknames !== undefined) {
      if (!Array.isArray(body.nicknames)) {
        errors.push('Apelidos deve ser uma lista');
      } else {
        if (body.nicknames.length > 10) {
          errors.push('Máximo 10 apelidos permitidos');
        }

        // Validar cada apelido
        const invalidNicknames = body.nicknames.filter(
          (nick) => typeof nick !== 'string' || nick.trim().length === 0 || nick.length > 30
        );

        if (invalidNicknames.length > 0) {
          errors.push('Cada apelido deve ter entre 1 e 30 caracteres');
        }

        // Remover duplicados e trim
        body.nicknames = [...new Set(body.nicknames.map(nick => nick.trim()))];
      }
    }

    if (body.personality_mode !== undefined) {
      const validModes = ['default', 'offensive', 'light_zen'];
      if (!validModes.includes(body.personality_mode)) {
        errors.push('Modo de personalidade inválido');
      }
    }

    if (errors.length > 0) {
      return errorResponse(errors.join(', '), 400);
    }

    const supabase = getSupabaseClient(context.env);

    // Buscar usuário atual
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !currentUser) {
      return errorResponse('Sessão inválida ou expirada', 401);
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (body.first_name !== undefined) {
      updateData.first_name = body.first_name.trim();
    }

    if (body.email !== undefined) {
      updateData.email = body.email ? body.email.trim().toLowerCase() : null;
    }

    if (body.nicknames !== undefined) {
      updateData.nicknames = body.nicknames;
    }

    if (body.personality_mode !== undefined) {
      updateData.personality_mode = body.personality_mode;
    }

    if (body.age !== undefined) {
      updateData.age = body.age ?? null;
    }

    if (body.gender !== undefined) {
      updateData.gender = body.gender ?? null;
    }

    if (body.weight !== undefined) {
      updateData.weight = body.weight ?? null;
    }

    if (body.height !== undefined) {
      updateData.height = body.height ?? null;
    }

    if (body.city !== undefined) {
      updateData.city = body.city ?? null;
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return errorResponse('Erro ao atualizar perfil', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
