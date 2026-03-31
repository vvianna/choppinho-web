/**
 * GET /api/activities/list?days=90
 * Returns all activities for the user within the specified period
 */
import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    const url = new URL(context.request.url);
    const days = parseInt(url.searchParams.get('days') || '90', 10);

    const supabase = getSupabaseClient(context.env);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse('Sessão inválida', 401);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date', startDate.toISOString())
      .order('start_date', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return errorResponse('Erro ao buscar atividades', 500);
    }

    return jsonResponse({
      success: true,
      data: {
        activities: activities || [],
        total: (activities || []).length,
        days,
      },
    });
  } catch (error) {
    console.error('Error in /api/activities/list:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};
