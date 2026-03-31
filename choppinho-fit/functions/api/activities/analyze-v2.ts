/**
 * Endpoint para gerar análise inteligente de atividades usando claude-runner
 * POST /api/activities/analyze-v2
 */

import { ApiResponse, Activity } from '../../shared/types';
import { getSupabaseClient } from '../../shared/supabase';

interface AnalyzeRequest {
  activity_id: string;
  force_regenerate?: boolean; // Forçar nova análise mesmo se já existe
}

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

    // Parse do body
    const body: AnalyzeRequest = await request.json();
    const { activity_id, force_regenerate = false } = body;

    if (!activity_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da atividade é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient(env);

    // Buscar atividade e dados do usuário
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select(`
        *,
        user:users(
          first_name,
          wa_name,
          personality_mode,
          nicknames
        )
      `)
      .eq('id', activity_id)
      .single();

    if (activityError || !activity) {
      return new Response(
        JSON.stringify({ success: false, error: 'Atividade não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe análise e não está forçando regeneração
    if (activity.analysis_summary && activity.analysis_detailed && !force_regenerate) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: activity.analysis_summary,
            detailed: activity.analysis_detailed,
            insights: activity.analysis_insights,
            generated_at: activity.analysis_generated_at,
            cached: true
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar próximas provas do usuário
    const { data: races } = await supabase
      .from('race_registrations')
      .select('race_name, race_date, distance')
      .eq('user_id', activity.user_id)
      .eq('status', 'upcoming')
      .gte('race_date', new Date().toISOString().split('T')[0])
      .order('race_date', { ascending: true })
      .limit(3);

    // Gerar análise com claude-runner
    const analysis = await generateActivityAnalysis(activity, activity.user, races || [], env);

    // Salvar análise no banco
    const { error: updateError } = await supabase
      .from('activities')
      .update({
        analysis_summary: analysis.summary,
        analysis_detailed: analysis.detailed,
        analysis_insights: analysis.insights,
        analysis_generated_at: new Date().toISOString()
      })
      .eq('id', activity_id);

    if (updateError) {
      console.error('Erro ao salvar análise:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar análise' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          summary: analysis.summary,
          detailed: analysis.detailed,
          insights: analysis.insights,
          generated_at: new Date().toISOString(),
          cached: false
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao gerar análise:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Gerar análise da atividade usando claude-runner
 */
async function generateActivityAnalysis(
  activity: any,
  user: any,
  upcoming_races: any[],
  env: any
) {
  // Preparar dados da atividade para o claude-runner
  const activityData = {
    id: activity.id,
    name: activity.name || 'Corrida',
    type: activity.activity_type,
    start_date: activity.start_date,
    start_date_local: activity.start_date,
    distance: activity.distance_meters,
    moving_time: activity.moving_time_seconds,
    elapsed_time: activity.elapsed_time_seconds || activity.moving_time_seconds,
    total_elevation_gain: activity.total_elevation_gain || 0,
    average_speed: activity.average_speed,
    max_speed: activity.max_speed,
    average_heartrate: activity.average_heartrate,
    max_heartrate: activity.max_heartrate,
    average_cadence: activity.average_cadence,
    calories: activity.calories,
    suffer_score: activity.suffer_score,
    // Adicionar coordenadas se disponíveis para busca de clima
    start_latlng: activity.start_latlng,
    start_latitude: activity.start_latitude,
    start_longitude: activity.start_longitude
  };

  // Preparar dados das próximas provas
  const racesData = upcoming_races.map(race => ({
    name: race.race_name,
    date: race.race_date,
    distance_km: race.distance
  }));

  // Preparar request para claude-runner
  const claudeRunnerRequest = {
    activity: activityData,
    athlete_name: user?.first_name || user?.wa_name || 'Atleta',
    nicknames: user?.nicknames || [],
    upcoming_races: racesData,
    humor: mapPersonalityToHumor(user?.personality_mode),
    model: 'opus', // ou 'haiku' para mais rápido
    timeout_ms: 60000
  };

  try {
    // URL do claude-runner (assumindo que está rodando localmente na porta 3333)
    const claudeRunnerUrl = env.CLAUDE_RUNNER_URL || 'http://localhost:3333';
    const claudeRunnerToken = env.CLAUDE_RUNNER_TOKEN;

    if (!claudeRunnerToken) {
      throw new Error('CLAUDE_RUNNER_TOKEN não configurado');
    }

    const response = await fetch(`${claudeRunnerUrl}/v1/choppinho/analyze-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${claudeRunnerToken}`
      },
      body: JSON.stringify(claudeRunnerRequest)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro do claude-runner:', error);
      throw new Error('Erro ao chamar claude-runner');
    }

    const result = await response.json();

    // O claude-runner retorna o resultado no campo stdout_raw
    const analysisText = result.stdout_raw || result.parsed || '';

    // Processar resposta para extrair as partes
    return parseAnalysisResponse(analysisText);

  } catch (error) {
    console.error('Erro ao gerar análise com claude-runner:', error);
    // Fallback com análise básica se o claude-runner falhar
    return generateBasicAnalysis(activity);
  }
}

/**
 * Mapear personality_mode para humor do claude-runner
 */
function mapPersonalityToHumor(personality_mode?: string): string {
  switch (personality_mode) {
    case 'offensive':
      return 'offensive';
    case 'light_zen':
      return 'light_zen';
    default:
      return 'default';
  }
}

/**
 * Processar resposta do Claude para extrair as partes
 */
function parseAnalysisResponse(text: string) {
  // Tentar extrair as seções específicas
  let summary = '';
  let detailed = text; // Por padrão, tudo é a análise detalhada
  let insights = {};

  // Extrair resumo se estiver marcado
  const summaryMatch = text.match(/(?:RESUMO|Summary|Resumo)[:\s]*([^\n]+(?:\n[^\n]+)?)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  // Extrair análise detalhada se estiver em seção específica
  const detailedMatch = text.match(/(?:ANÁLISE DETALHADA|Análise Detalhada|ANÁLISE)[:\s]*([\s\S]*?)(?=\n\n[A-Z]|$)/i);
  if (detailedMatch) {
    detailed = detailedMatch[1].trim();
  }

  // Extrair JSON de insights se houver
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      insights = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Se falhar, usar valores padrão
      insights = {
        pace_consistency: 0.8,
        training_load: 'optimal',
        fatigue_level: 'low',
        recommendations: ['Continue mantendo a regularidade', 'Hidrate-se adequadamente'],
        personal_records: {}
      };
    }
  }

  // Se não conseguiu extrair um resumo, criar um baseado no texto
  if (!summary && text.length > 0) {
    const lines = text.split('\n').filter(line => line.trim());
    summary = lines.slice(0, 2).join(' ').substring(0, 200);
  }

  return {
    summary: summary || 'Análise do treino concluída com sucesso!',
    detailed: detailed || text,
    insights
  };
}

/**
 * Análise básica de fallback (sem IA)
 */
function generateBasicAnalysis(activity: any) {
  const distanceKm = (activity.distance_meters / 1000).toFixed(2);
  const paceMinPerKm = activity.average_speed > 0
    ? Math.floor(1000 / (activity.average_speed * 60)) + ':' +
      String(Math.round((1000 / (activity.average_speed * 60) % 1) * 60)).padStart(2, '0')
    : 'N/A';

  const summary = `Treino de ${distanceKm}km concluído com pace médio de ${paceMinPerKm}/km. ${
    activity.average_heartrate && activity.average_heartrate < 150
      ? 'Ótima zona de treino aeróbico!'
      : 'Intensidade elevada, bom trabalho!'
  }`;

  const detailed = `
📊 ANÁLISE DO TREINO

🏃 Desempenho Geral:
- Distância total: ${distanceKm} km
- Tempo em movimento: ${Math.floor(activity.moving_time_seconds / 60)} minutos
- Pace médio: ${paceMinPerKm}/km
- Velocidade média: ${activity.average_speed?.toFixed(2)} m/s

${activity.average_heartrate ? `
❤️ Frequência Cardíaca:
- FC média: ${activity.average_heartrate} bpm
- FC máxima: ${activity.max_heartrate || 'N/A'} bpm
- Zona de treino: ${getHeartRateZone(activity.average_heartrate)}
` : ''}

${activity.calories ? `
🔥 Gasto Calórico:
- Total: ${activity.calories} kcal
- Taxa: ${(activity.calories / (activity.moving_time_seconds / 60)).toFixed(1)} kcal/min
` : ''}

💡 Recomendações:
- Mantenha a regularidade nos treinos
- Hidrate-se adequadamente antes e depois
- Considere variar o tipo de treino (intervalados, longões, recovery)
- Preste atenção aos sinais do seu corpo
`;

  const insights = {
    pace_consistency: 0.85,
    training_load: activity.average_heartrate && activity.average_heartrate > 160 ? 'high' : 'optimal',
    fatigue_level: 'low',
    recommendations: [
      'Manter consistência de treinos',
      'Incluir treinos de velocidade',
      'Trabalhar fortalecimento muscular'
    ],
    personal_records: {
      best_pace: false,
      longest_run: false
    }
  };

  return { summary, detailed, insights };
}

/**
 * Helpers
 */
function getHeartRateZone(avgHr: number): string {
  if (avgHr < 120) return 'Zona 1 - Recovery';
  if (avgHr < 140) return 'Zona 2 - Base aeróbica';
  if (avgHr < 160) return 'Zona 3 - Tempo/Limiar';
  if (avgHr < 180) return 'Zona 4 - VO2 Max';
  return 'Zona 5 - Anaeróbica';
}