/**
 * Endpoint para comparação de atividades
 * POST /api/activities/compare - Comparar múltiplas atividades
 * GET /api/activities/compare/:id - Buscar comparações de uma atividade
 */

import { ApiResponse, ActivityComparison } from '../../shared/types';
import { createSupabaseClient } from '../../shared/supabase';

interface CompareRequest {
  activity_ids: string[]; // IDs das atividades a comparar
  comparison_type?: 'manual' | 'auto'; // Tipo de comparação
}

interface ComparisonResult {
  activities: any[];
  comparisons: ActivityComparison[];
  metrics_summary: {
    best_pace: {
      activity_id: string;
      value: number;
    };
    longest_distance: {
      activity_id: string;
      value: number;
    };
    best_efficiency: {
      activity_id: string;
      value: number; // pace vs heart rate
    };
  };
  insights: string;
}

// POST - Comparar atividades manualmente
export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  try {
    // Verificar autenticação
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: CompareRequest = await request.json();
    const { activity_ids, comparison_type = 'manual' } = body;

    if (!activity_ids || activity_ids.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Selecione pelo menos 2 atividades para comparar' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(env);

    // Buscar dados das atividades
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .in('id', activity_ids)
      .order('start_date', { ascending: false });

    if (activitiesError || !activities || activities.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Atividades não encontradas' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar comparações entre as atividades
    const comparisons: ActivityComparison[] = [];

    for (let i = 0; i < activities.length - 1; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const comparison = await generateComparison(activities[i], activities[j], env);
        comparisons.push(comparison);

        // Salvar comparação no banco se for manual
        if (comparison_type === 'manual') {
          await saveComparison(comparison, supabase);
        }
      }
    }

    // Calcular métricas resumidas
    const metrics_summary = calculateMetricsSummary(activities);

    // Gerar insights gerais
    const insights = generateComparisonInsights(activities, comparisons);

    const result: ComparisonResult = {
      activities,
      comparisons,
      metrics_summary,
      insights
    };

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao comparar atividades:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET - Buscar comparações existentes de uma atividade
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, params } = context;

  try {
    // Verificar autenticação
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extrair activity_id da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const activity_id = pathParts[pathParts.length - 1];

    if (!activity_id || activity_id === 'compare') {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da atividade é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(env);

    // Buscar comparações da atividade
    const { data: comparisons, error } = await supabase
      .from('activity_comparisons')
      .select(`
        *,
        activity:activities!activity_id(*),
        compared:activities!compared_with_id(*)
      `)
      .or(`activity_id.eq.${activity_id},compared_with_id.eq.${activity_id}`)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar comparações:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar comparações' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: comparisons || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao buscar comparações:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Gerar comparação entre duas atividades
 */
async function generateComparison(activity1: any, activity2: any, env: any): Promise<ActivityComparison> {
  // Calcular similaridade
  const similarity = calculateSimilarity(activity1, activity2);

  // Determinar tipo de comparação
  const comparison_type = determineComparisonType(activity1, activity2);

  // Calcular métricas comparativas
  const metrics_comparison = {
    distance: {
      activity_1: activity1.distance_meters,
      activity_2: activity2.distance_meters,
      difference: activity2.distance_meters - activity1.distance_meters,
      percentage: ((activity2.distance_meters - activity1.distance_meters) / activity1.distance_meters * 100)
    },
    pace: {
      activity_1: calculatePaceSeconds(activity1),
      activity_2: calculatePaceSeconds(activity2),
      difference: calculatePaceSeconds(activity2) - calculatePaceSeconds(activity1),
      percentage: ((calculatePaceSeconds(activity2) - calculatePaceSeconds(activity1)) / calculatePaceSeconds(activity1) * 100),
      improvement: calculatePaceSeconds(activity2) < calculatePaceSeconds(activity1)
    },
    heart_rate: activity1.average_heartrate && activity2.average_heartrate ? {
      activity_1: activity1.average_heartrate,
      activity_2: activity2.average_heartrate,
      difference: activity2.average_heartrate - activity1.average_heartrate,
      efficiency_gain: activity2.average_heartrate < activity1.average_heartrate &&
                       calculatePaceSeconds(activity2) <= calculatePaceSeconds(activity1)
    } : undefined,
    elevation: {
      activity_1: activity1.total_elevation_gain || 0,
      activity_2: activity2.total_elevation_gain || 0,
      difference: (activity2.total_elevation_gain || 0) - (activity1.total_elevation_gain || 0)
    }
  };

  // Gerar insights da comparação
  const insights = generateInsights(activity1, activity2, metrics_comparison);

  return {
    id: crypto.randomUUID(),
    user_id: activity1.user_id,
    activity_id: activity1.id,
    compared_with_id: activity2.id,
    comparison_type,
    similarity_score: similarity,
    metrics_comparison,
    insights,
    generated_at: new Date().toISOString()
  };
}

/**
 * Calcular similaridade entre duas atividades
 */
function calculateSimilarity(a1: any, a2: any): number {
  // Pesos para cada métrica
  const weights = {
    distance: 0.4,
    duration: 0.3,
    pace: 0.3
  };

  // Similaridade de distância
  const maxDistance = Math.max(a1.distance_meters, a2.distance_meters);
  const distanceSimilarity = 1 - Math.abs(a1.distance_meters - a2.distance_meters) / maxDistance;

  // Similaridade de duração
  const maxDuration = Math.max(a1.moving_time_seconds, a2.moving_time_seconds);
  const durationSimilarity = 1 - Math.abs(a1.moving_time_seconds - a2.moving_time_seconds) / maxDuration;

  // Similaridade de pace
  const pace1 = calculatePaceSeconds(a1);
  const pace2 = calculatePaceSeconds(a2);
  const maxPace = Math.max(pace1, pace2);
  const paceSimilarity = 1 - Math.abs(pace1 - pace2) / maxPace;

  // Calcular score ponderado
  const totalScore =
    distanceSimilarity * weights.distance +
    durationSimilarity * weights.duration +
    paceSimilarity * weights.pace;

  return Math.round(totalScore * 100) / 100;
}

/**
 * Determinar tipo de comparação
 */
function determineComparisonType(a1: any, a2: any): ActivityComparison['comparison_type'] {
  const distanceDiff = Math.abs(a1.distance_meters - a2.distance_meters);
  const distancePercent = distanceDiff / Math.max(a1.distance_meters, a2.distance_meters);

  // Se a distância é similar (menos de 10% de diferença)
  if (distancePercent < 0.1) {
    return 'similar_distance';
  }

  // Se são da mesma semana
  const date1 = new Date(a1.start_date);
  const date2 = new Date(a2.start_date);
  const weekDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24 * 7);

  if (weekDiff < 1) {
    return 'weekly_best';
  }

  // Se são do mesmo mês
  if (weekDiff < 4) {
    return 'monthly_best';
  }

  return 'similar_distance';
}

/**
 * Calcular pace em segundos por km
 */
function calculatePaceSeconds(activity: any): number {
  if (!activity.distance_meters || !activity.moving_time_seconds) {
    return 0;
  }
  return (activity.moving_time_seconds / (activity.distance_meters / 1000));
}

/**
 * Gerar insights da comparação
 */
function generateInsights(a1: any, a2: any, metrics: any): string {
  const insights: string[] = [];

  // Análise de pace
  if (metrics.pace.improvement) {
    const improvementSeconds = Math.abs(metrics.pace.difference);
    insights.push(`Melhoria de pace: ${Math.floor(improvementSeconds / 60)}:${String(Math.round(improvementSeconds % 60)).padStart(2, '0')}/km mais rápido`);
  }

  // Análise de eficiência cardíaca
  if (metrics.heart_rate?.efficiency_gain) {
    insights.push('Ganho de eficiência cardíaca detectado - mesmo pace com menor FC');
  }

  // Análise de distância
  if (Math.abs(metrics.distance.percentage) > 20) {
    insights.push(`Variação significativa de distância: ${metrics.distance.percentage > 0 ? '+' : ''}${metrics.distance.percentage.toFixed(1)}%`);
  }

  return insights.join('. ') || 'Treinos com características similares';
}

/**
 * Calcular métricas resumidas
 */
function calculateMetricsSummary(activities: any[]) {
  // Encontrar melhor pace
  const bestPace = activities.reduce((best, activity) => {
    const pace = calculatePaceSeconds(activity);
    return (!best || pace < best.value) ? { activity_id: activity.id, value: pace } : best;
  }, null);

  // Encontrar maior distância
  const longestDistance = activities.reduce((longest, activity) => {
    return (!longest || activity.distance_meters > longest.value)
      ? { activity_id: activity.id, value: activity.distance_meters }
      : longest;
  }, null);

  // Encontrar melhor eficiência (pace vs FC)
  const bestEfficiency = activities.reduce((best, activity) => {
    if (!activity.average_heartrate) return best;
    const efficiency = calculatePaceSeconds(activity) / activity.average_heartrate;
    return (!best || efficiency < best.value)
      ? { activity_id: activity.id, value: efficiency }
      : best;
  }, null);

  return {
    best_pace: bestPace,
    longest_distance: longestDistance,
    best_efficiency: bestEfficiency
  };
}

/**
 * Gerar insights gerais da comparação
 */
function generateComparisonInsights(activities: any[], comparisons: ActivityComparison[]): string {
  const avgSimilarity = comparisons.reduce((sum, c) => sum + c.similarity_score, 0) / comparisons.length;

  if (avgSimilarity > 0.8) {
    return 'Treinos muito consistentes! Excelente regularidade de performance.';
  } else if (avgSimilarity > 0.6) {
    return 'Boa consistência entre os treinos com algumas variações positivas.';
  } else {
    return 'Treinos com características variadas, ótimo para desenvolvimento completo.';
  }
}

/**
 * Salvar comparação no banco
 */
async function saveComparison(comparison: ActivityComparison, supabase: any) {
  const { error } = await supabase
    .from('activity_comparisons')
    .insert({
      user_id: comparison.user_id,
      activity_id: comparison.activity_id,
      compared_with_id: comparison.compared_with_id,
      comparison_type: comparison.comparison_type,
      similarity_score: comparison.similarity_score,
      metrics_comparison: comparison.metrics_comparison,
      insights: comparison.insights
    });

  if (error) {
    console.error('Erro ao salvar comparação:', error);
  }
}