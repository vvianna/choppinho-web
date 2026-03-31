/**
 * Types compartilhados entre Cloudflare Functions
 * Mantém sincronizado com choppinho-fit/src/lib/types.ts
 */

export interface User {
  id: string;
  phone_number: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  web_session_token?: string;
  last_login_at?: string;
  subscription_plan: 'free' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  subscription_started_at?: string;
  subscription_expires_at?: string;
  personality_mode: 'default' | 'offensive' | 'zen';
  nicknames?: string[]; // Lista de apelidos para personalização (ex: ["Monstro", "Fera"])
}

export interface StravaConnection {
  id: string;
  user_id: string;
  strava_athlete_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  connected_at: string;
  is_valid: boolean;
}

export interface Activity {
  id: string;
  user_id: string;
  strava_activity_id: string;
  activity_type: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  workout_type?: number; // 0=default, 1=race, 3=workout (interval/tempo)
  synced_at: string;
  // Novos campos para análise com IA
  raw_data?: any;
  analysis_summary?: string;
  analysis_detailed?: string;
  analysis_generated_at?: string;
  summary_sent?: boolean;
  detailed_sent?: boolean;
  analysis_insights?: AnalysisInsights;
}

export interface AnalysisInsights {
  pace_consistency: number;
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

export interface ActivityComparison {
  id: string;
  user_id: string;
  activity_id: string;
  compared_with_id: string;
  comparison_type: 'similar_distance' | 'similar_route' | 'pb_attempt' | 'weekly_best' | 'monthly_best';
  similarity_score: number;
  metrics_comparison: any;
  insights?: string;
  generated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  daily_summary: boolean;
  weekly_summary: boolean;
  activity_reminders: boolean;
  friday_choppinho: boolean;
  whatsapp_notifications: boolean;
  weekly_summary_day: string;
  weekly_summary_time: string;
  paused_until?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  id: string;
  phone_number: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  connected: boolean;
  total_runs?: number;
  total_km?: number;
  avg_pace?: string;
  total_time?: number;
  avg_heartrate?: number;
  total_calories?: number;
  recent_activities?: Activity[];
  weekly_evolution?: WeeklyStats[];
}

export interface WeeklyStats {
  week_start: string;
  total_runs: number;
  total_km: number;
  avg_speed: number;
  avg_heartrate?: number;
  total_moving_time_seconds: number;
  total_calories?: number;
}
