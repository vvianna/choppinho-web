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
  splits_json: any | null; // JSONB
  insight_sent: boolean;
  synced_at: string;
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
