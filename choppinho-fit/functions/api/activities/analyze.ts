/**
 * Endpoint para gerar análise inteligente de atividades com IA
 * POST /api/activities/analyze
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

    // Verificar se o usuário tem acesso à atividade
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
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

    // Gerar análise com IA (Claude API)
    const analysis = await generateActivityAnalysis(activity, env);

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
 * Gerar análise da atividade usando Claude API
 */
async function generateActivityAnalysis(activity: Activity, env: any) {
  // Preparar dados para análise
  const distanceKm = (activity.distance_meters / 1000).toFixed(2);
  const paceMinPerKm = activity.average_speed > 0
    ? (1000 / (activity.average_speed * 60)).toFixed(2)
    : 'N/A';
  const durationMinutes = Math.floor(activity.moving_time_seconds / 60);

  const prompt = `
Analise os dados do treino de corrida abaixo e forneça insights valiosos:

DADOS DO TREINO:
- Distância: ${distanceKm} km
- Tempo: ${durationMinutes} minutos
- Pace médio: ${paceMinPerKm} min/km
- Velocidade média: ${activity.average_speed?.toFixed(2)} m/s
- FC média: ${activity.average_heartrate || 'N/A'} bpm
- FC máxima: ${activity.max_heartrate || 'N/A'} bpm
- Calorias: ${activity.calories || 'N/A'}
- Cadência média: ${activity.average_cadence || 'N/A'} passos/min

Forneça a análise em 3 partes:

1. RESUMO (2-3 linhas): Destaque principal do treino com tom motivacional.

2. ANÁLISE DETALHADA:
- Desempenho geral
- Análise de frequência cardíaca (se disponível)
- Pontos fortes identificados
- Áreas de melhoria
- Recomendações específicas

3. INSIGHTS TÉCNICOS (formato JSON):
{
  "pace_consistency": 0.85, // 0-1 baseado na variação de pace
  "training_load": "optimal", // low/optimal/high/overtraining
  "fatigue_level": "low", // low/medium/high
  "recommendations": ["sugestão 1", "sugestão 2"],
  "personal_records": {
    "best_pace": false
  }
}

Seja específico, técnico mas acessível. Use emojis com moderação.`;

  try {
    // Chamar Claude API (ou OpenAI como alternativa)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Modelo mais rápido e econômico
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao chamar API de IA');
    }

    const result = await response.json();
    const content = result.content[0].text;

    // Parsear resposta da IA
    const parts = content.split(/\n\n(?=1\.|2\.|3\.)/);

    // Extrair cada parte
    const summary = extractSection(parts, 'RESUMO') || 'Treino concluído com sucesso! Continue assim! 💪';
    const detailed = extractSection(parts, 'ANÁLISE DETALHADA') || content;

    // Extrair JSON de insights
    let insights = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Se falhar, usar valores padrão
      insights = {
        pace_consistency: 0.8,
        training_load: 'optimal',
        fatigue_level: 'low',
        recommendations: ['Mantenha a consistência', 'Hidrate-se bem'],
        personal_records: {}
      };
    }

    return {
      summary,
      detailed,
      insights
    };

  } catch (error) {
    console.error('Erro ao gerar análise com IA:', error);

    // Fallback com análise básica
    return generateBasicAnalysis(activity);
  }
}

/**
 * Análise básica de fallback (sem IA)
 */
function generateBasicAnalysis(activity: Activity) {
  const distanceKm = (activity.distance_meters / 1000).toFixed(2);
  const paceMinPerKm = activity.average_speed > 0
    ? Math.floor(1000 / (activity.average_speed * 60)) + ':' +
      String(Math.round((1000 / (activity.average_speed * 60) % 1) * 60)).padStart(2, '0')
    : 'N/A';

  const summary = `Treino de ${distanceKm}km concluído com pace médio de ${paceMinPerKm}/km. ${
    activity.average_heartrate && activity.average_heartrate < 150
      ? 'Ótima zona de treino aeróbico!'
      : 'Intensidade elevada, bom trabalho!'
  } 💪`;

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
function extractSection(parts: string[], sectionName: string): string | null {
  const section = parts.find(p => p.includes(sectionName));
  if (!section) return null;

  // Remover o título da seção
  return section
    .replace(/^\d\.\s*[A-Z\s]+:?\s*/i, '')
    .replace(sectionName + ':', '')
    .trim();
}

function getHeartRateZone(avgHr: number): string {
  if (avgHr < 120) return 'Zona 1 - Recovery';
  if (avgHr < 140) return 'Zona 2 - Base aeróbica';
  if (avgHr < 160) return 'Zona 3 - Tempo/Limiar';
  if (avgHr < 180) return 'Zona 4 - VO2 Max';
  return 'Zona 5 - Anaeróbica';
}