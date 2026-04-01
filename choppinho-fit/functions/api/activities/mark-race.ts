/**
 * PATCH /api/activities/mark-race
 * Body: { strava_activity_id: number, workout_type: number }
 */
import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) return errorResponse('Não autenticado', 401);

    const supabase = getSupabaseClient(context.env);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('web_session_token', sessionToken)
      .single();

    if (userError || !user) return errorResponse('Sessão inválida', 401);

    const body = await context.request.json() as { strava_activity_id: number; workout_type: number };

    if (!body.strava_activity_id || body.workout_type === undefined) {
      return errorResponse('strava_activity_id e workout_type são obrigatórios', 400);
    }

    // Only allow 0 (default) or 1 (race)
    const workoutType = body.workout_type === 1 ? 1 : 0;

    const { error: updateError } = await supabase
      .from('activities')
      .update({ workout_type: workoutType })
      .eq('user_id', user.id)
      .eq('strava_activity_id', body.strava_activity_id);

    if (updateError) {
      console.error('Error updating workout_type:', updateError);
      return errorResponse('Erro ao atualizar', 500);
    }

    return jsonResponse({ success: true, workout_type: workoutType });
  } catch (error) {
    console.error('Error in mark-race:', error);
    return errorResponse('Erro interno', 500);
  }
};
