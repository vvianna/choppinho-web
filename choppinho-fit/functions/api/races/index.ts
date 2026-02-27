/**
 * FASE 7: Provas Inscritas - CRUD completo
 * GET /api/races - Lista todas as provas do usuário
 * POST /api/races - Cria nova prova
 * PUT /api/races - Atualiza prova existente
 * DELETE /api/races - Remove prova
 */

import { getSupabaseClient } from "../../shared/supabase";
import { jsonResponse, errorResponse, extractSessionToken, type Env } from "../../_middleware";

interface RaceRegistration {
  id?: string;
  user_id?: string;
  race_name: string;
  race_date: string; // ISO date string
  distance: number;
  race_type: "running" | "triathlon" | "ironman";
  location?: string;
  registration_number?: string;
  goal_time?: string; // HH:MM:SS format
  notes?: string;
  status?: "upcoming" | "completed" | "cancelled";
  result_time?: string; // HH:MM:SS format
  result_position?: number;
}

// GET /api/races - Lista todas as provas do usuário
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

    // Buscar provas do usuário, ordenadas por data (mais próximas primeiro)
    const { data: races, error } = await supabase
      .from("race_registrations")
      .select("*")
      .eq("user_id", user.id)
      .order("race_date", { ascending: true });

    if (error) {
      console.error("Error fetching races:", error);
      return errorResponse("Erro ao buscar provas", 500);
    }

    return jsonResponse({
      success: true,
      data: {
        races: races || [],
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/races:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// POST /api/races - Cria nova prova
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
    const body: RaceRegistration = await context.request.json();

    // Validações
    const errors: string[] = [];

    if (!body.race_name || body.race_name.trim() === "") {
      errors.push("Nome da prova é obrigatório");
    }

    if (!body.race_date) {
      errors.push("Data da prova é obrigatória");
    }

    if (!body.distance || body.distance <= 0) {
      errors.push("Distância deve ser maior que 0");
    }

    if (body.race_type && !["running", "triathlon", "ironman"].includes(body.race_type)) {
      errors.push("Tipo de prova inválido");
    }

    if (errors.length > 0) {
      return errorResponse(errors.join(", "), 400);
    }

    // Inserir no banco
    const { data: newRace, error } = await supabase
      .from("race_registrations")
      .insert({
        user_id: user.id,
        race_name: body.race_name.trim(),
        race_date: body.race_date,
        distance: body.distance,
        race_type: body.race_type || "running",
        location: body.location?.trim() || null,
        registration_number: body.registration_number?.trim() || null,
        goal_time: body.goal_time || null,
        notes: body.notes?.trim() || null,
        status: body.status || "upcoming",
        result_time: body.result_time || null,
        result_position: body.result_position || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating race:", error);
      return errorResponse("Erro ao criar prova", 500);
    }

    return jsonResponse({
      success: true,
      message: "Prova criada com sucesso",
      data: { race: newRace },
    });
  } catch (error: any) {
    console.error("Error in POST /api/races:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// PUT /api/races - Atualiza prova existente
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
    const body: RaceRegistration = await context.request.json();

    if (!body.id) {
      return errorResponse("ID da prova é obrigatório", 400);
    }

    // Validações
    const errors: string[] = [];

    if (body.race_name !== undefined && body.race_name.trim() === "") {
      errors.push("Nome da prova não pode ser vazio");
    }

    if (body.distance !== undefined && body.distance <= 0) {
      errors.push("Distância deve ser maior que 0");
    }

    if (body.race_type && !["running", "triathlon", "ironman"].includes(body.race_type)) {
      errors.push("Tipo de prova inválido");
    }

    if (errors.length > 0) {
      return errorResponse(errors.join(", "), 400);
    }

    // Verificar se a prova pertence ao usuário
    const { data: existingRace } = await supabase
      .from("race_registrations")
      .select("id")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .single();

    if (!existingRace) {
      return errorResponse("Prova não encontrada", 404);
    }

    // Montar objeto de atualização (apenas campos enviados)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.race_name !== undefined) updateData.race_name = body.race_name.trim();
    if (body.race_date !== undefined) updateData.race_date = body.race_date;
    if (body.distance !== undefined) updateData.distance = body.distance;
    if (body.race_type !== undefined) updateData.race_type = body.race_type;
    if (body.location !== undefined) updateData.location = body.location?.trim() || null;
    if (body.registration_number !== undefined) updateData.registration_number = body.registration_number?.trim() || null;
    if (body.goal_time !== undefined) updateData.goal_time = body.goal_time || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.result_time !== undefined) updateData.result_time = body.result_time || null;
    if (body.result_position !== undefined) updateData.result_position = body.result_position || null;

    // Atualizar no banco
    const { data: updatedRace, error } = await supabase
      .from("race_registrations")
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating race:", error);
      return errorResponse("Erro ao atualizar prova", 500);
    }

    return jsonResponse({
      success: true,
      message: "Prova atualizada com sucesso",
      data: { race: updatedRace },
    });
  } catch (error: any) {
    console.error("Error in PUT /api/races:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};

// DELETE /api/races - Remove prova
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

    // Parse body ou query param
    const url = new URL(context.request.url);
    const raceId = url.searchParams.get("id");

    if (!raceId) {
      return errorResponse("ID da prova é obrigatório", 400);
    }

    // Deletar (verificando ownership)
    const { error } = await supabase
      .from("race_registrations")
      .delete()
      .eq("id", raceId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting race:", error);
      return errorResponse("Erro ao deletar prova", 500);
    }

    return jsonResponse({
      success: true,
      message: "Prova removida com sucesso",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/races:", error);
    return errorResponse(error.message || "Erro interno", 500);
  }
};
