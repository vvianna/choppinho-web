/**
 * POST /api/training-plans/generate
 * Calls Sonnet (plan) + Opus (coaching) in parallel on the choppinho backend
 */
import { jsonResponse, errorResponse, extractSessionToken, type Env } from '../../_middleware';
import { getSupabaseClient } from '../../shared/supabase';

interface GenerateEnv extends Env {
  CHOPPINHO_API_URL: string;
  CHOPPINHO_API_TOKEN: string;
}

export const onRequestPost: PagesFunction<GenerateEnv> = async (context) => {
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

    const body = await context.request.json() as {
      runner_profile: Record<string, unknown>;
      base_plan: Record<string, unknown>;
      plan_summary: Record<string, unknown>;
    };

    const apiUrl = context.env.CHOPPINHO_API_URL || 'http://localhost:3334';
    const apiToken = context.env.CHOPPINHO_API_TOKEN || '';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    };

    // Call both endpoints in parallel
    const [personalizeRes, coachingRes] = await Promise.allSettled([
      // Etapa 2: Sonnet personalizes sessions
      fetch(`${apiUrl}/v1/choppinho/personalize-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_plan: body.base_plan,
          runner_profile: body.runner_profile,
        }),
      }),
      // Etapa 3: Opus generates coaching
      fetch(`${apiUrl}/v1/choppinho/enhance-training-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          training_plan: body.plan_summary,
          runner_profile: body.runner_profile,
        }),
      }),
    ]);

    // Parse results (graceful — either can fail independently)
    let plan = null;
    let coaching = null;
    let personalizeMs = 0;
    let coachingMs = 0;

    if (personalizeRes.status === 'fulfilled' && personalizeRes.value.ok) {
      try {
        const data = await personalizeRes.value.json();
        if (data.ok && data.plan) {
          plan = data.plan;
          personalizeMs = data.duration_ms || 0;
        }
      } catch (e) { console.error('Parse personalize error:', e); }
    }

    if (coachingRes.status === 'fulfilled' && coachingRes.value.ok) {
      try {
        const data = await coachingRes.value.json();
        if (data.ok && data.insights) {
          coaching = data.insights;
          coachingMs = data.duration_ms || 0;
        }
      } catch (e) { console.error('Parse coaching error:', e); }
    }

    return jsonResponse({
      success: true,
      data: {
        ok: plan !== null,
        plan,
        coaching,
        personalize_ms: personalizeMs,
        coaching_ms: coachingMs,
      },
    });
  } catch (error) {
    console.error('Error in generate:', error);
    return errorResponse('Erro interno', 500);
  }
};
