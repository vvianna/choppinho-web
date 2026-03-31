/**
 * FASE 2b-6: Planos de Treino - CRUD completo
 * GET /api/training-plans - Lista todos os planos do usuário
 * GET /api/training-plans?id=xxx - Busca plano por ID
 * POST /api/training-plans - Cria novo plano
 * PUT /api/training-plans - Atualiza plano existente
 */

import { getSupabaseClient } from "../../shared/supabase";
import { jsonResponse, errorResponse, extractSessionToken, type Env } from "../../_middleware";

interface TrainingPlan {
  id?: string;
  user_id?: string;
  race_id?: string;
  created_at?: string;
  updated_at?: string;

  // Prova
  race_distance?: string;
  race_distance_custom?: number;
  race_name?: string;
  race_date?: string;
  race_city?: string;
  race_terrain?: "road" | "trail" | "mixed";

  // Perfil
  runner_name?: string;
  age?: number;
  gender?: "m" | "f" | "o";
  weight?: number;
  height?: number;

  // Histórico
  experience_level?: "sedentary" | "beginner" | "intermediate" | "advanced" | "competitive";
  weekly_km?: number;
  longest_run?: number;
  recent_race_distance?: string;
  recent_race_time?: string;
  current_pace_easy?: string;
  strava_data?: any;

  // Rotina
  days_per_week?: number;
  max_time_weekday?: number;
  max_time_weekend?: number;
  preferred_time?: "morning" | "afternoon" | "evening" | "flexible";
  cross_training?: string[];
  has_watch?: boolean;
  uses_heart_rate?: boolean;

  // Saúde
  injuries?: string;
  health_conditions?: string;
  sleep_hours?: number;
  stress_level?: "low" | "moderate" | "high";

  // Objetivos
  goal_type?: "finish" | "time" | "pr" | "compete";
  target_time?: string;
  motivation?: string;
  biggest_challenge?: string;

  // Plano gerado
  plan_data?: any;
  vdot_score?: number;
  total_weeks?: number;
  ai_insights?: any;
  status?: "draft" | "active" | "completed";
}

// GET /api/training-plans - Lista todos os planos do usuário (ou busca por ?id=xxx)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const supabase = getSupabaseClient(context.env);

    // Validar sessão
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) {
      return errorResponse("Não autenticado", 401);
    }

    // Buscar usuário pela sessão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("web_session_token", sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse("Sessão inválida", 401);
    }

    const url = new URL(context.request.url);
    const planId = url.searchParams.get("id");

    if (planId) {
      // Buscar plano específico por ID
      const { data: plan, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", user.id)
        .single();

      if (error || !plan) {
        return errorResponse("Plano não encontrado", 404);
      }

      return jsonResponse({
        success: true,
        data: { plan },
      });
    }

    // Listar todos os planos do usuário, mais recentes primeiro
    const { data: plans, error } = await supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching training plans:", error);
      return errorResponse("Erro ao buscar planos de treino", 500);
    }

    return jsonResponse({
      success: true,
      data: {
        plans: plans || [],
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/training-plans:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// POST /api/training-plans - Cria novo plano
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const supabase = getSupabaseClient(context.env);

    // Validar sessão
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) {
      return errorResponse("Não autenticado", 401);
    }

    // Buscar usuário pela sessão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("web_session_token", sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse("Sessão inválida", 401);
    }

    // Parse body
    const body: TrainingPlan = await context.request.json();

    // Validações básicas
    if (!body.race_distance) {
      return errorResponse("Distância da prova é obrigatória", 400);
    }

    if (!body.days_per_week || body.days_per_week < 1 || body.days_per_week > 7) {
      return errorResponse("Dias por semana deve estar entre 1 e 7", 400);
    }

    // Inserir no banco
    const { data: newPlan, error } = await supabase
      .from("training_plans")
      .insert({
        user_id: user.id,
        race_id: body.race_id || null,
        race_distance: body.race_distance,
        race_distance_custom: body.race_distance_custom || null,
        race_name: body.race_name || null,
        race_date: body.race_date || null,
        race_city: body.race_city || null,
        race_terrain: body.race_terrain || "road",
        runner_name: body.runner_name || null,
        age: body.age || null,
        gender: body.gender || null,
        weight: body.weight || null,
        height: body.height || null,
        experience_level: body.experience_level || null,
        weekly_km: body.weekly_km || null,
        longest_run: body.longest_run || null,
        recent_race_distance: body.recent_race_distance || null,
        recent_race_time: body.recent_race_time || null,
        current_pace_easy: body.current_pace_easy || null,
        strava_data: body.strava_data || null,
        days_per_week: body.days_per_week,
        max_time_weekday: body.max_time_weekday || null,
        max_time_weekend: body.max_time_weekend || null,
        preferred_time: body.preferred_time || "flexible",
        cross_training: body.cross_training || null,
        has_watch: body.has_watch ?? false,
        uses_heart_rate: body.uses_heart_rate ?? false,
        injuries: body.injuries || null,
        health_conditions: body.health_conditions || null,
        sleep_hours: body.sleep_hours || null,
        stress_level: body.stress_level || "moderate",
        goal_type: body.goal_type || null,
        target_time: body.target_time || null,
        motivation: body.motivation || null,
        biggest_challenge: body.biggest_challenge || null,
        plan_data: body.plan_data || null,
        vdot_score: body.vdot_score || null,
        total_weeks: body.total_weeks || null,
        ai_insights: body.ai_insights || null,
        status: body.status || "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating training plan:", error);
      return errorResponse("Erro ao criar plano de treino", 500);
    }

    return jsonResponse({
      success: true,
      message: "Plano de treino criado com sucesso",
      data: { plan: newPlan },
    });
  } catch (error: any) {
    console.error("Error in POST /api/training-plans:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// PUT /api/training-plans - Atualiza plano existente
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const supabase = getSupabaseClient(context.env);

    // Validar sessão
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) {
      return errorResponse("Não autenticado", 401);
    }

    // Buscar usuário pela sessão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("web_session_token", sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse("Sessão inválida", 401);
    }

    // Parse body
    const body: TrainingPlan = await context.request.json();

    if (!body.id) {
      return errorResponse("ID do plano é obrigatório", 400);
    }

    // Verificar se o plano pertence ao usuário
    const { data: existingPlan } = await supabase
      .from("training_plans")
      .select("id")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .single();

    if (!existingPlan) {
      return errorResponse("Plano não encontrado", 404);
    }

    // Montar objeto de atualização (apenas campos enviados)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.race_id !== undefined) updateData.race_id = body.race_id;
    if (body.race_distance !== undefined) updateData.race_distance = body.race_distance;
    if (body.race_distance_custom !== undefined) updateData.race_distance_custom = body.race_distance_custom;
    if (body.race_name !== undefined) updateData.race_name = body.race_name;
    if (body.race_date !== undefined) updateData.race_date = body.race_date;
    if (body.race_city !== undefined) updateData.race_city = body.race_city;
    if (body.race_terrain !== undefined) updateData.race_terrain = body.race_terrain;
    if (body.runner_name !== undefined) updateData.runner_name = body.runner_name;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.experience_level !== undefined) updateData.experience_level = body.experience_level;
    if (body.weekly_km !== undefined) updateData.weekly_km = body.weekly_km;
    if (body.longest_run !== undefined) updateData.longest_run = body.longest_run;
    if (body.recent_race_distance !== undefined) updateData.recent_race_distance = body.recent_race_distance;
    if (body.recent_race_time !== undefined) updateData.recent_race_time = body.recent_race_time;
    if (body.current_pace_easy !== undefined) updateData.current_pace_easy = body.current_pace_easy;
    if (body.strava_data !== undefined) updateData.strava_data = body.strava_data;
    if (body.days_per_week !== undefined) updateData.days_per_week = body.days_per_week;
    if (body.max_time_weekday !== undefined) updateData.max_time_weekday = body.max_time_weekday;
    if (body.max_time_weekend !== undefined) updateData.max_time_weekend = body.max_time_weekend;
    if (body.preferred_time !== undefined) updateData.preferred_time = body.preferred_time;
    if (body.cross_training !== undefined) updateData.cross_training = body.cross_training;
    if (body.has_watch !== undefined) updateData.has_watch = body.has_watch;
    if (body.uses_heart_rate !== undefined) updateData.uses_heart_rate = body.uses_heart_rate;
    if (body.injuries !== undefined) updateData.injuries = body.injuries;
    if (body.health_conditions !== undefined) updateData.health_conditions = body.health_conditions;
    if (body.sleep_hours !== undefined) updateData.sleep_hours = body.sleep_hours;
    if (body.stress_level !== undefined) updateData.stress_level = body.stress_level;
    if (body.goal_type !== undefined) updateData.goal_type = body.goal_type;
    if (body.target_time !== undefined) updateData.target_time = body.target_time;
    if (body.motivation !== undefined) updateData.motivation = body.motivation;
    if (body.biggest_challenge !== undefined) updateData.biggest_challenge = body.biggest_challenge;
    if (body.plan_data !== undefined) updateData.plan_data = body.plan_data;
    if (body.vdot_score !== undefined) updateData.vdot_score = body.vdot_score;
    if (body.total_weeks !== undefined) updateData.total_weeks = body.total_weeks;
    if (body.ai_insights !== undefined) updateData.ai_insights = body.ai_insights;
    if (body.status !== undefined) updateData.status = body.status;

    // Atualizar no banco
    const { data: updatedPlan, error } = await supabase
      .from("training_plans")
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating training plan:", error);
      return errorResponse("Erro ao atualizar plano de treino", 500);
    }

    return jsonResponse({
      success: true,
      message: "Plano de treino atualizado com sucesso",
      data: { plan: updatedPlan },
    });
  } catch (error: any) {
    console.error("Error in PUT /api/training-plans:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// DELETE /api/training-plans - Remove plano
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const supabase = getSupabaseClient(context.env);

    // Validar sessão
    const sessionToken = extractSessionToken(context.request);
    if (!sessionToken) {
      return errorResponse("Não autenticado", 401);
    }

    // Buscar usuário pela sessão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("web_session_token", sessionToken)
      .single();

    if (userError || !user) {
      return errorResponse("Sessão inválida", 401);
    }

    // Buscar ID via query param
    const url = new URL(context.request.url);
    const planId = url.searchParams.get("id");

    if (!planId) {
      return errorResponse("ID do plano é obrigatório", 400);
    }

    // Deletar (verificando ownership)
    const { error } = await supabase
      .from("training_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting training plan:", error);
      return errorResponse("Erro ao deletar plano de treino", 500);
    }

    return jsonResponse({
      success: true,
      message: "Plano de treino removido com sucesso",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/training-plans:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};
