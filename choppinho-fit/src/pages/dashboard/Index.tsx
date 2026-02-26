import { useState, useEffect } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  LogOut,
  MapPin,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearSession } from "../../lib/auth";

interface DashboardStats {
  connected: boolean;
  total_runs?: number;
  total_km?: number;
  avg_pace?: string;
  total_time?: number;
  avg_heartrate?: number;
  total_calories?: number;
  recent_activities?: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/stats/dashboard?period=week", {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Sessão inválida, redirecionar para login
            clearSession();
            navigate("/login");
            return;
          }
          throw new Error("Erro ao buscar dados do dashboard");
        }

        const data = await response.json();
        setStats(data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError("Erro ao carregar dados. Tente novamente.");
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    clearSession();
    navigate("/login");
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "0min";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10">
      <div className="grain-overlay" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/choppinho-mascot.png"
              alt="Choppinho"
              className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover mix-blend-multiply"
            />
            <div>
              <h1 className="font-display font-bold text-xl text-primary">
                Choppinho<span className="text-accent">Fit</span>
              </h1>
              <p className="text-xs text-bark/60 font-body">Dashboard</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-bark/60 hover:text-bark font-body text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-8">
            <p className="text-sm text-red-800 font-body">{error}</p>
          </div>
        )}

        {/* Not Connected State */}
        {!loading && stats && !stats.connected && (
          <div className="bg-accent/15 border-2 border-accent/30 rounded-xl p-6 text-center">
            <h3 className="font-display font-bold text-xl text-bark mb-2">
              Strava não conectado
            </h3>
            <p className="font-body text-bark/70">
              Conecte sua conta do Strava para ver suas estatísticas.
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && stats && stats.connected && (
          <>
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <span className="font-body text-sm text-bark/60">
                    Distância Total
                  </span>
                </div>
                <p className="font-display font-bold text-3xl text-bark">
                  {stats.total_km || 0} km
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Activity size={20} className="text-accent-600" />
                  </div>
                  <span className="font-body text-sm text-bark/60">Corridas</span>
                </div>
                <p className="font-display font-bold text-3xl text-bark">
                  {stats.total_runs || 0}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Zap size={20} className="text-blue-600" />
                  </div>
                  <span className="font-body text-sm text-bark/60">Pace Médio</span>
                </div>
                <p className="font-display font-bold text-3xl text-bark">
                  {stats.avg_pace || "0:00"}
                  <span className="text-lg text-bark/60">/km</span>
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Clock size={20} className="text-purple-600" />
                  </div>
                  <span className="font-body text-sm text-bark/60">
                    Tempo Total
                  </span>
                </div>
                <p className="font-display font-bold text-3xl text-bark">
                  {formatTime(stats.total_time)}
                </p>
              </div>
            </div>

            {/* Gráfico de Evolução (placeholder) */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 size={24} className="text-primary" />
                <h2 className="font-display font-bold text-xl text-bark">
                  Evolução Semanal
                </h2>
              </div>

              <div className="bg-primary/5 rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-primary/20">
                <div className="text-center">
                  <TrendingUp size={48} className="text-primary/30 mx-auto mb-3" />
                  <p className="font-body text-bark/60">
                    Gráfico será implementado com Recharts
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Atividades */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <Activity size={24} className="text-primary" />
                <h2 className="font-display font-bold text-xl text-bark">
                  Últimas Corridas
                </h2>
              </div>

              {stats.recent_activities && stats.recent_activities.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-primary/5 transition-colors border border-primary/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-body font-bold text-bark">
                            Corrida
                          </p>
                          <div className="flex items-center gap-3 text-sm text-bark/60 font-body">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(activity.start_date).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatTime(activity.moving_time_seconds)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-display font-bold text-lg text-bark">
                          {((activity.distance_meters || 0) / 1000).toFixed(2)} km
                        </p>
                        <p className="text-sm text-bark/60 font-body">
                          {activity.average_speed?.toFixed(2) || "0"} m/s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-bark/60 font-body">
                  Nenhuma atividade encontrada no período.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
