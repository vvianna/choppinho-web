/**
 * GET /api/stats/dashboard?period=week
 * Retorna estatísticas agregadas do dashboard
 *
 * Recebe: Header Authorization: Bearer {session_token}
 *         Query param 'period' (week | month) - default: week
 * Retorna: Stats agregadas + últimas atividades + evolução semanal
 */

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';
import type { Activity } from '../../shared/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Extrair session token do header
    const sessionToken = extractSessionToken(context.request);

    if (!sessionToken) {
      return errorResponse('Token de sessão não fornecido', 401);
    }

    // Extrair period da query string
    const url = new URL(context.request.url);
    const period = url.searchParams.get('period') || 'week';

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

    // Verificar se tem Strava conectado
    const { data: stravaConnection } = await supabase
      .from('strava_connections')
      .select('id, is_valid')
      .eq('user_id', user.id)
      .eq('is_valid', true)
      .single();

    if (!stravaConnection) {
      // Não tem Strava conectado
      return jsonResponse({
        success: true,
        data: {
          connected: false,
        },
      });
    }

    // Calcular data de início baseado no período
    const daysAgo = period === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Buscar atividades do período
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_type', 'Run')
      .gte('start_date', startDate.toISOString())
      .order('start_date', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return errorResponse('Erro ao buscar atividades', 500);
    }

    // Se não tem atividades no período
    if (!activities || activities.length === 0) {
      return jsonResponse({
        success: true,
        data: {
          connected: true,
          total_runs: 0,
          total_km: 0,
          avg_pace: '0:00',
          total_time: 0,
          avg_heartrate: 0,
          total_calories: 0,
          recent_activities: [],
          weekly_evolution: [],
        },
      });
    }

    // Calcular estatísticas agregadas
    const totalRuns = activities.length;
    const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distance_meters || 0), 0);
    const totalKm = Math.round((totalDistanceMeters / 1000) * 100) / 100;
    const totalTime = activities.reduce((sum, a) => sum + (a.moving_time_seconds || 0), 0);
    const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);

    // Calcular pace médio (min/km)
    let avgPace = '0:00';
    if (totalKm > 0 && totalTime > 0) {
      const paceSeconds = totalTime / totalKm; // segundos por km
      const paceMinutes = Math.floor(paceSeconds / 60);
      const paceSecondsRemainder = Math.round(paceSeconds % 60);
      avgPace = `${paceMinutes}:${paceSecondsRemainder.toString().padStart(2, '0')}`;
    }

    // Calcular heartrate médio (apenas das atividades que têm)
    const activitiesWithHR = activities.filter(a => a.average_heartrate);
    const avgHeartrate = activitiesWithHR.length > 0
      ? Math.round(activitiesWithHR.reduce((sum, a) => sum + a.average_heartrate!, 0) / activitiesWithHR.length)
      : null;

    // Buscar últimas 10 atividades
    const recentActivities = activities.slice(0, 10);

    // Calcular evolução diária
    const dailyEvolution = calculateDailyEvolution(activities, daysAgo);

    return jsonResponse({
      success: true,
      data: {
        connected: true,
        total_runs: totalRuns,
        total_km: totalKm,
        avg_pace: avgPace,
        total_time: totalTime,
        avg_heartrate: avgHeartrate,
        total_calories: totalCalories,
        recent_activities: recentActivities,
        weekly_evolution: dailyEvolution,
      },
    });

  } catch (error) {
    console.error('Error in /api/stats/dashboard:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
};

/**
 * Calcula evolução diária (todos os dias do período)
 */
function calculateDailyEvolution(activities: Activity[], daysAgo: number) {
  // Criar um mapa de todos os dias do período
  const dailyMap: Record<string, any> = {};

  // Preencher com todos os dias (mesmo os sem atividade)
  const today = new Date();
  for (let i = 0; i < daysAgo; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    dailyMap[dateKey] = {
      date: dateKey,
      total_runs: 0,
      total_km: 0,
      total_moving_time_seconds: 0,
      total_calories: 0,
      avg_speed: 0,
      avg_heartrate: 0,
      heartrate_count: 0,
    };
  }

  // Agregar atividades por dia
  activities.forEach(activity => {
    const date = new Date(activity.start_date);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (dailyMap[dateKey]) {
      dailyMap[dateKey].total_runs += 1;
      dailyMap[dateKey].total_km += (activity.distance_meters || 0) / 1000;
      dailyMap[dateKey].total_moving_time_seconds += activity.moving_time_seconds || 0;
      dailyMap[dateKey].total_calories += activity.calories || 0;
      dailyMap[dateKey].avg_speed += activity.average_speed || 0;

      if (activity.average_heartrate) {
        dailyMap[dateKey].avg_heartrate += activity.average_heartrate;
        dailyMap[dateKey].heartrate_count += 1;
      }
    }
  });

  // Formatar resultado
  const result = Object.values(dailyMap).map((day: any) => ({
    week_start: day.date, // mantém o nome do campo para compatibilidade
    total_runs: day.total_runs,
    total_km: Math.round(day.total_km * 100) / 100,
    avg_speed: day.total_runs > 0
      ? Math.round((day.avg_speed / day.total_runs) * 100) / 100
      : 0,
    avg_heartrate: day.heartrate_count > 0
      ? Math.round(day.avg_heartrate / day.heartrate_count)
      : null,
    total_moving_time_seconds: day.total_moving_time_seconds,
    total_calories: day.total_calories,
  }));

  // Ordenar por data (mais antiga primeiro para gráfico)
  return result.sort((a, b) => a.week_start.localeCompare(b.week_start));
}
