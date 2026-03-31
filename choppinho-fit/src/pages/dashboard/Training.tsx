import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  MapPin,
  Settings,
  LogOut,
  Plus,
  ClipboardList,
  Eye,
  Edit,
} from "lucide-react";
import { getAuthHeaders, clearSession } from "../../lib/auth";
import { getTrainingPlans } from "../../lib/api";
import { RaceRegistration, TrainingPlan } from "../../lib/types";
import Toast from "../../components/Toast";

type ToastType = { message: string; type: "success" | "error" | "info" } | null;

export default function Training() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [races, setRaces] = useState<RaceRegistration[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [toast, setToast] = useState<ToastType>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch races
      const racesResponse = await fetch("/api/races", {
        headers: getAuthHeaders(),
      });

      if (racesResponse.status === 401) {
        clearSession();
        navigate("/login");
        return;
      }

      const racesData = await racesResponse.json();
      if (!racesResponse.ok || !racesData.success) {
        throw new Error(racesData.error || "Erro ao carregar provas");
      }
      setRaces(racesData.data.races);

      // Fetch training plans
      const plansData = await getTrainingPlans();
      if (plansData && plansData.success) {
        setPlans(plansData.data?.plans || plansData.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching training data:", err);
      setError(err.message || "Erro ao carregar dados");
      setToast({ message: err.message || "Erro ao carregar dados", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const findPlanForRace = (race: RaceRegistration): TrainingPlan | null => {
    // Match by race_id first
    const byId = plans.find((p) => p.race_id === race.id);
    if (byId) return byId;

    // Match by race_name + race_date
    const byNameDate = plans.find(
      (p) =>
        p.race_name === race.race_name && p.race_date === race.race_date
    );
    return byNameDate || null;
  };

  const getPlanStatusBadge = (plan: TrainingPlan | null) => {
    if (!plan) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          Sem plano
        </span>
      );
    }
    if (plan.status === "completed") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Concluído
        </span>
      );
    }
    // active or draft
    const totalWeeks = plan.total_weeks ?? 0;
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Em treino{totalWeeks > 0 ? ` · ${totalWeeks} sem` : ""}
      </span>
    );
  };

  const formatDistance = (km: number): string => {
    if (km === 42 || km === 42.2 || km === 42.195) return "42K";
    if (km === 21 || km === 21.1 || km === 21.097) return "21K";
    if (km === 10) return "10K";
    if (km === 5) return "5K";
    return `${km}K`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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
              <p className="text-xs text-bark/60 font-body">Provas &amp; Treino</p>
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
              className="flex items-center gap-1 sm:gap-2 text-primary font-body text-sm font-semibold p-2 sm:p-0"
              title="Provas & Treino"
              aria-current="page"
            >
              <Trophy size={16} />
              <span className="hidden sm:inline">Provas &amp; Treino</span>
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
            Provas &amp; Treino
          </h2>
          <p className="text-bark/60 font-body text-sm mt-1">
            Acompanhe suas provas inscritas e planos de treino
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
        {!loading && !error && races.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary/10">
            <Trophy size={48} className="mx-auto text-bark/20 mb-4" />
            <p className="text-bark/60 font-body font-semibold">
              Nenhuma prova cadastrada
            </p>
            <p className="text-bark/40 font-body text-sm mt-2">
              Cadastre sua próxima prova para gerar um plano de treino personalizado.
            </p>
          </div>
        )}

        {/* Race Cards */}
        {!loading && !error && races.length > 0 && (
          <div className="space-y-4">
            {races.map((race) => {
              const plan = findPlanForRace(race);

              return (
                <div
                  key={race.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {/* Distance badge */}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          {formatDistance(race.distance)}
                        </span>
                        {/* Plan status badge */}
                        {getPlanStatusBadge(plan)}
                      </div>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-bark break-words">
                        {race.race_name}
                      </h3>
                    </div>
                  </div>

                  {/* Race details */}
                  <div className="flex flex-wrap gap-4 text-sm text-bark/70 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-primary flex-shrink-0" />
                      <span>{formatDate(race.race_date)}</span>
                    </div>
                    {race.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-primary flex-shrink-0" />
                        <span>{race.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    {!plan ? (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/treino/novo/${race.id}`)
                        }
                        className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-body font-semibold text-sm shadow-sm shadow-primary/20 transition-colors"
                      >
                        <Plus size={16} />
                        Gerar plano
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/treino/plano/${plan.id}`)
                        }
                        className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-body font-semibold text-sm shadow-sm shadow-primary/20 transition-colors"
                      >
                        <Eye size={16} />
                        Ver plano
                      </button>
                    )}

                    <button
                      onClick={() => navigate("/dashboard/races")}
                      className="flex items-center gap-2 bg-bark/5 hover:bg-bark/10 text-bark px-5 py-2.5 rounded-xl font-body font-semibold text-sm transition-colors border border-bark/10"
                    >
                      <Edit size={16} />
                      Editar prova
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cadastrar prova button */}
        {!loading && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate("/dashboard/races")}
              className="flex items-center gap-2 bg-white/90 hover:bg-white border border-primary/20 text-primary px-6 py-3 rounded-xl font-body font-semibold transition-colors shadow-sm"
            >
              <Plus size={18} />
              Cadastrar prova
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
