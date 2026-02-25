import { useState } from "react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [phoneNumber] = useState(
    localStorage.getItem("choppinho_user_phone") || "+55 21 96707-6547"
  );

  const handleLogout = () => {
    localStorage.removeItem("choppinho_session_token");
    localStorage.removeItem("choppinho_user_phone");
    navigate("/login");
  };

  // 🎭 MOCK DATA: Dados fake para demonstração
  const mockStats = {
    total_km: 32.5,
    total_runs: 4,
    avg_pace: "5:45",
    total_time: "3h 17min",
  };

  const mockActivities = [
    {
      id: 1,
      name: "Corrida Matinal 🌅",
      date: "2026-02-24",
      distance: 10.2,
      time: "58:30",
      pace: "5:44",
    },
    {
      id: 2,
      name: "Longão de Domingo",
      date: "2026-02-23",
      distance: 15.0,
      time: "1:28:00",
      pace: "5:52",
    },
    {
      id: 3,
      name: "Treino Intervalado",
      date: "2026-02-21",
      distance: 5.0,
      time: "27:15",
      pace: "5:27",
    },
    {
      id: 4,
      name: "Recovery Run",
      date: "2026-02-20",
      distance: 2.3,
      time: "14:30",
      pace: "6:18",
    },
  ];

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
              <p className="text-xs text-bark/60 font-body">{phoneNumber}</p>
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
        {/* Alert de Demo */}
        <div className="bg-accent/15 border-2 border-accent/30 rounded-xl p-4 mb-8">
          <p className="text-sm text-bark font-body">
            🎭 <strong>MODO DEMO:</strong> Estes são dados fake para
            demonstração da interface. A versão real buscará seus dados do
            Strava via Supabase.
          </p>
        </div>

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
              {mockStats.total_km} km
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
              {mockStats.total_runs}
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
              {mockStats.avg_pace}
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
              {mockStats.total_time}
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

          <div className="space-y-3">
            {mockActivities.map((activity) => (
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
                      {activity.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-bark/60 font-body">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(activity.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-display font-bold text-lg text-bark">
                    {activity.distance} km
                  </p>
                  <p className="text-sm text-bark/60 font-body">
                    {activity.pace}/km
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
