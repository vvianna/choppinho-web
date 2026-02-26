// Cloudflare Function temporária para inserir dados fake
// DELETE DEPOIS DE USAR!

import { getSupabaseClient } from '../../shared/supabase';
import { jsonResponse, errorResponse } from '../../_middleware';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const supabase = getSupabaseClient(context.env);
    const phoneNumber = '+5521982238663';

    // 1. Garantir que o usuário existe
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, phone_number, full_name')
      .eq('phone_number', phoneNumber)
      .single();

    let userId: string;

    if (userCheckError || !existingUser) {
      // Criar usuário se não existir
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          full_name: 'Victor Teste',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        return errorResponse('Erro ao criar usuário: ' + createError.message, 500);
      }

      userId = newUser!.id;
      console.log('Usuário criado:', userId);
    } else {
      userId = existingUser.id;
      console.log('Usuário existente:', userId);
    }

    // 2. Criar atividades fake
    const activities = [];
    const now = new Date();

    // Helper para calcular data
    const daysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Semana 1 (há 4 semanas) - 3 corridas
    activities.push(
      { user_id: userId, activity_date: daysAgo(28), distance_km: 5.2, duration_minutes: 32, avg_pace_min_per_km: '6:09', calories: 320, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(26), distance_km: 8.5, duration_minutes: 55, avg_pace_min_per_km: '6:28', calories: 510, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(24), distance_km: 6.0, duration_minutes: 38, avg_pace_min_per_km: '6:20', calories: 370, activity_type: 'run' }
    );

    // Semana 2 (há 3 semanas) - 4 corridas
    activities.push(
      { user_id: userId, activity_date: daysAgo(21), distance_km: 5.8, duration_minutes: 36, avg_pace_min_per_km: '6:12', calories: 350, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(19), distance_km: 10.0, duration_minutes: 64, avg_pace_min_per_km: '6:24', calories: 600, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(18), distance_km: 7.2, duration_minutes: 45, avg_pace_min_per_km: '6:15', calories: 430, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(16), distance_km: 5.0, duration_minutes: 31, avg_pace_min_per_km: '6:12', calories: 300, activity_type: 'run' }
    );

    // Semana 3 (há 2 semanas) - 5 corridas (boa semana!)
    activities.push(
      { user_id: userId, activity_date: daysAgo(14), distance_km: 6.5, duration_minutes: 40, avg_pace_min_per_km: '6:09', calories: 390, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(12), distance_km: 8.0, duration_minutes: 50, avg_pace_min_per_km: '6:15', calories: 480, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(11), distance_km: 12.0, duration_minutes: 76, avg_pace_min_per_km: '6:20', calories: 720, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(10), distance_km: 5.5, duration_minutes: 34, avg_pace_min_per_km: '6:11', calories: 330, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(8), distance_km: 7.8, duration_minutes: 48, avg_pace_min_per_km: '6:09', calories: 470, activity_type: 'run' }
    );

    // Semana 4 (semana atual) - 7 corridas
    activities.push(
      { user_id: userId, activity_date: daysAgo(7), distance_km: 7.0, duration_minutes: 44, avg_pace_min_per_km: '6:17', calories: 420, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(6), distance_km: 9.2, duration_minutes: 58, avg_pace_min_per_km: '6:18', calories: 550, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(5), distance_km: 8.2, duration_minutes: 52, avg_pace_min_per_km: '6:20', calories: 490, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(4), distance_km: 6.8, duration_minutes: 42, avg_pace_min_per_km: '6:10', calories: 410, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(3), distance_km: 5.5, duration_minutes: 34, avg_pace_min_per_km: '6:11', calories: 330, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(2), distance_km: 10.5, duration_minutes: 66, avg_pace_min_per_km: '6:17', calories: 630, activity_type: 'run' },
      { user_id: userId, activity_date: daysAgo(1), distance_km: 15.0, duration_minutes: 96, avg_pace_min_per_km: '6:24', calories: 900, activity_type: 'run' }
    );

    // 3. Inserir todas as atividades
    const { data: insertedActivities, error: insertError } = await supabase
      .from('activities')
      .insert(activities)
      .select();

    if (insertError) {
      return errorResponse('Erro ao inserir atividades: ' + insertError.message, 500);
    }

    // 4. Buscar estatísticas para confirmar
    const { data: stats, error: statsError } = await supabase
      .rpc('get_user_stats', { p_user_id: userId });

    if (statsError) {
      console.error('Erro ao buscar stats:', statsError);
    }

    return jsonResponse({
      success: true,
      message: 'Dados fake inseridos com sucesso!',
      user_id: userId,
      phone_number: phoneNumber,
      activities_inserted: insertedActivities?.length || 0,
      summary: {
        total_corridas: insertedActivities?.length || 0,
        total_km: insertedActivities?.reduce((sum, a) => sum + a.distance_km, 0).toFixed(2),
        periodo: '28 dias (4 semanas)',
      },
      stats: stats || null,
    });

  } catch (error: any) {
    console.error('Erro no seed:', error);
    return errorResponse('Erro ao processar seed: ' + error.message, 500);
  }
};
