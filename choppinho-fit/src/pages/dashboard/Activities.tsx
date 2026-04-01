import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Activity as ActivityIcon,
  Settings,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { getAuthHeaders, clearSession } from "../../lib/auth";
import Toast from "../../components/Toast";

interface Activity {
  id: string;
  strava_activity_id: number;
  name: string;
  activity_type: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  average_heartrate?: number;
  workout_type: number;
}

type ToastType = { message: string; type: "success" | "error" | "info" } | null;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPace(seconds: number, meters: number): string {
  if (meters <= 0) return "—";
  const paceSeconds = seconds / (meters / 1000);
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

export default function Activities() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [toast, setToast] = useState<ToastType>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/activities/list?days=365", {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        clearSession();
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao carregar atividades");
      }

      const runs: Activity[] = (data.data.activities || []).filter(
        (a: Activity) => a.activity_type === "Run"
      );
      setActivities(runs);
    } catch (err: any) {
      console.error("Error fetching activities:", err);
      setError(err.message || "Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  };

  const toggleRace = async (activity: Activity) => {
    const newType = activity.workout_type === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/activities/mark-race", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          strava_activity_id: activity.strava_activity_id,
          workout_type: newType,
        }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      setActivities((prev) =>
        prev.map((a) =>
          a.strava_activity_id === activity.strava_activity_id
            ? { ...a, workout_type: newType }
            : a
        )
      );
      setToast({
        message: newType === 1 ? "Marcada como prova!" : "Desmarcada",
        type: "success",
      });
    } catch (err) {
      setToast({ message: "Erro ao atualizar atividade", type: "error" });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
              <p className="text-xs text-bark/60 font-body">Atividades</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 sm:gap-2 text-bark/60 hover:text-primary font-body text-sm transition-colors p-2 sm:p-0"
              title="Dashboard"
            >
              <ClipboardList size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/treino")}
              className="flex items-center gap-1 sm:gap-2 text-bark/60 hover:text-primary font-body text-sm transition-colors p-2 sm:p-0"
              title="Minhas Provas"
            >
              <Trophy size={16} />
              <span className="hidden sm:inline">Minhas Provas</span>
            </button>

            <button
              className="flex items-center gap-1 sm:gap-2 text-primary font-body text-sm font-semibold p-2 sm:p-0"
              title="Atividades"
              aria-current="page"
            >
              <ActivityIcon size={16} />
              <span className="hidden sm:inline">Atividades</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="flex items-center gap-1 sm:gap-2 text-bark/60 hover:text-primary font-body text-sm transition-colors p-2 sm:p-0"
              title="Configurações"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Config</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-bark/60 hover:text-bark font-body text-sm transition-colors p-2 sm:p-0"
              title="Sair"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-bark">
            Atividades
          </h2>
          <p className="text-bark/60 font-body text-sm mt-1">
            Suas corridas dos últimos 365 dias
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-body">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activities.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary/10">
            <ActivityIcon size={48} className="mx-auto text-bark/20 mb-4" />
            <p className="text-bark/60 font-body font-semibold">
              Nenhuma corrida encontrada
            </p>
            <p className="text-bark/40 font-body text-sm mt-2">
              Sincronize suas atividades do Strava para vê-las aqui.
            </p>
          </div>
        )}

        {/* Activity Cards */}
        {!loading && !error && activities.length > 0 && (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-primary/10 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-body font-bold text-bark text-sm truncate">
                      {activity.name}
                    </span>
                    {activity.workout_type === 1 && (
                      <span className="px-2 py-0.5 bg-accent text-bark text-xs font-bold rounded">
                        PROVA
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-bark/60">
                    <span>{formatDate(activity.start_date)}</span>
                    <span>
                      {(activity.distance_meters / 1000).toFixed(1)} km
                    </span>
                    <span>
                      {formatPace(
                        activity.moving_time_seconds,
                        activity.distance_meters
                      )}
                    </span>
                    {activity.average_heartrate && (
                      <span>
                        FC {Math.round(activity.average_heartrate)} bpm
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleRace(activity)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                    activity.workout_type === 1
                      ? "bg-accent/20 text-accent hover:bg-red-100 hover:text-red-600"
                      : "bg-bark/5 text-bark/50 hover:bg-accent/10 hover:text-accent border border-bark/10"
                  }`}
                >
                  <Trophy size={14} />
                  {activity.workout_type === 1 ? "Desmarcar" : "Marcar prova"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
