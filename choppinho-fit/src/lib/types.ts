// 🍺 Choppinho Fit - TypeScript Types
// Tipos baseados no schema do Supabase (choppinho)

export interface User {
  id: string; // UUID
  phone_number: string;
  wa_name: string | null;
  first_name: string | null;
  email: string | null;
  chatwoot_contact_id: number | null;
  chatwoot_conversation_id: number | null;
  onboarding_status: string | null;
  is_active: boolean;
  created_at: string;
  onboarding_completed_at: string | null;
  // Campos adicionados na Fase 1:
  web_session_token: string | null;
  last_login_at: string | null;
  subscription_plan: 'free' | 'pro' | 'teams';
  subscription_status: 'active' | 'canceled' | 'expired';
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  personality_mode: 'default' | 'offensive' | 'light_zen';
  // Fase 5: Apelidos
  nicknames: string[]; // Lista de apelidos para personalização (ex: ["Monstro", "Fera"])
}

export interface StravaConnection {
  id: string; // UUID
  user_id: string;
  strava_athlete_id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  scope: string;
  connected_at: string;
  is_valid: boolean;
}

export interface Activity {
  id: string; // UUID
  user_id: string;
  strava_activity_id: number;
  activity_type: string;
  name: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  calories: number | null;
  average_cadence: number | null;
  workout_type?: number; // 0=default, 1=race, 3=workout (interval/tempo)
  splits_json: any | null; // JSONB
  insight_sent: boolean;
  synced_at: string;
  // Novos campos para análise com IA
  raw_data?: any; // JSON completo do Strava
  analysis_summary?: string; // Resumo 2-3 linhas
  analysis_detailed?: string; // Análise completa
  analysis_generated_at?: string;
  summary_sent?: boolean;
  detailed_sent?: boolean;
  analysis_insights?: AnalysisInsights;
}

// Insights estruturados da análise
export interface AnalysisInsights {
  pace_consistency: number; // 0-1
  heart_rate_zones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  improvement_rate?: number;
  fatigue_level?: 'low' | 'medium' | 'high';
  training_load?: 'low' | 'optimal' | 'high' | 'overtraining';
  recommendations?: string[];
  personal_records?: {
    fastest_5k?: boolean;
    fastest_10k?: boolean;
    longest_run?: boolean;
    best_pace?: boolean;
  };
}

// Comparação entre atividades
export interface ActivityComparison {
  id: string;
  user_id: string;
  activity_id: string;
  compared_with_id: string;
  comparison_type: 'similar_distance' | 'similar_route' | 'pb_attempt' | 'weekly_best' | 'monthly_best';
  similarity_score: number; // 0-1
  metrics_comparison: MetricsComparison;
  insights?: string;
  generated_at: string;
}

// Métricas comparativas
export interface MetricsComparison {
  distance: {
    activity_1: number;
    activity_2: number;
    difference: number;
    percentage: number;
  };
  pace: {
    activity_1: number; // segundos/km
    activity_2: number;
    difference: number;
    percentage: number;
    improvement: boolean;
  };
  heart_rate?: {
    activity_1: number;
    activity_2: number;
    difference: number;
    efficiency_gain: boolean;
  };
  elevation?: {
    activity_1: number;
    activity_2: number;
    difference: number;
  };
  splits?: Array<{
    km: number;
    pace_1: number;
    pace_2: number;
    difference: number;
  }>;
}

// View materializada para consultas externas
export interface ComparisonView extends ActivityComparison {
  activity_date: string;
  activity_distance: number;
  activity_time: number;
  activity_speed: number;
  activity_hr?: number;
  compared_date: string;
  compared_distance: number;
  compared_time: number;
  compared_speed: number;
  compared_hr?: number;
  distance_change_pct: number;
  speed_change_pct: number;
  time_improvement_pct: number;
  user_name?: string;
  user_phone: string;
}

export interface NotificationPreferences {
  id: string; // UUID
  user_id: string;
  notify_run_insights: boolean;
  notify_weekly_summary: boolean;
  notify_goals: boolean;
  notify_training_tips: boolean;
  quiet_hours_start: string | null; // TIME
  quiet_hours_end: string | null; // TIME
  updated_at: string;
  // Campos adicionados na Fase 1:
  weekly_summary_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weekly_summary_time: string; // TIME (HH:MM:SS)
  paused_until: string | null; // TIMESTAMPTZ
}

export interface AuthToken {
  id: string; // UUID
  phone_number: string;
  token: string; // UUID
  used: boolean;
  expires_at: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Tipos auxiliares para o frontend
// ─────────────────────────────────────────────

export interface DashboardStats {
  total_runs: number;
  total_km: number;
  total_moving_time_seconds: number;
  avg_pace: string; // Formatado: "05:30 /km"
  avg_speed: number;
  avg_heartrate: number | null;
  total_calories: number;
  recent_activities: Activity[];
  weekly_evolution: WeeklyStats[];
}

export interface WeeklyStats {
  week_start: string;
  total_runs: number;
  total_km: number;
  avg_speed: number;
  avg_heartrate: number | null;
  total_moving_time_seconds: number;
  total_calories: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  message?: string;
}

export interface UserProfile {
  user: User;
  strava_connection: StravaConnection | null;
  notification_preferences: NotificationPreferences | null;
}

// ─────────────────────────────────────────────
// Tipos para Strava OAuth
// ─────────────────────────────────────────────

export interface StravaOAuthParams {
  client_id: string;
  redirect_uri: string;
  state: string; // user.id (UUID)
  response_type: 'code';
  approval_prompt: 'force' | 'auto';
  scope: string;
}

// ─────────────────────────────────────────────
// Helpers de formatação
// ─────────────────────────────────────────────

export const formatPace = (speedMetersPerSecond: number): string => {
  // Converte m/s para min/km
  const minutesPerKm = 1000 / (speedMetersPerSecond * 60);
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
};

export const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2) + ' km';
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min ${secs}s`;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Formato brasileiro: +55 (21) 96707-6547
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }

  // Apenas retorna o número limpo se não conseguir formatar
  return `+${cleaned}`;
};

// ─────────────────────────────────────────────
// FASE 7: Provas Inscritas
// ─────────────────────────────────────────────

export interface RaceRegistration {
  id: string; // UUID
  user_id: string;
  // Campos obrigatórios
  race_name: string;
  race_date: string; // ISO date string (YYYY-MM-DD)
  distance: number; // KM
  race_type: 'running' | 'triathlon' | 'ironman';
  // Campos opcionais
  location?: string | null;
  registration_number?: string | null;
  goal_time?: string | null; // HH:MM:SS
  notes?: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  result_time?: string | null; // HH:MM:SS
  result_position?: number | null;
  created_at: string;
  updated_at: string;
}

export interface RaceFormData {
  race_type: 'running' | 'triathlon' | 'ironman';
  race_name: string;
  race_date: string;
  distance: number;
  location?: string;
  registration_number?: string;
  goal_time?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// Plano de Treino
// ─────────────────────────────────────────────

export interface TrainingPlan {
  id: string;
  user_id: string;
  race_id?: string;
  created_at: string;
  updated_at: string;

  // Prova
  race_distance: string;
  race_distance_custom?: number;
  race_name?: string;
  race_date?: string;
  race_city?: string;
  race_terrain: 'road' | 'trail' | 'mixed';

  // Perfil
  runner_name?: string;
  age?: number;
  gender?: 'm' | 'f' | 'o';
  weight?: number;
  height?: number;

  // Histórico
  experience_level?: 'sedentary' | 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  weekly_km?: number;
  longest_run?: number;
  recent_race_distance?: string;
  recent_race_time?: string;
  current_pace_easy?: string;
  strava_data?: any;

  // Rotina
  days_per_week: number;
  max_time_weekday?: number;
  max_time_weekend?: number;
  preferred_time: 'morning' | 'afternoon' | 'evening' | 'flexible';
  cross_training?: string[];
  has_watch: boolean;
  uses_heart_rate: boolean;

  // Saúde
  injuries?: string;
  health_conditions?: string;
  sleep_hours?: number;
  stress_level: 'low' | 'moderate' | 'high';

  // Objetivos
  goal_type?: 'finish' | 'time' | 'pr' | 'compete';
  target_time?: string;
  motivation?: string;
  biggest_challenge?: string;

  // Plano gerado
  plan_data?: any;
  vdot_score?: number;
  total_weeks?: number;
  ai_insights?: any;
  status: 'draft' | 'active' | 'completed';
}

export interface PlanSessionLog {
  id: string;
  plan_id: string;
  week_number: number;
  day_of_week: number;
  scheduled_date: string;
  session_type: string;

  strava_activity_id?: number;
  completed: boolean;
  completed_at?: string;

  difficulty?: 'easy' | 'normal' | 'hard';
  notes?: string;

  created_at: string;
}
