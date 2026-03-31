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
  Trash2,
  X,
  Hash,
  Target,
  Clock,
} from "lucide-react";
import { getAuthHeaders, clearSession } from "../../lib/auth";
import { getTrainingPlans } from "../../lib/api";
import { RaceRegistration, TrainingPlan, RaceFormData } from "../../lib/types";
import Toast from "../../components/Toast";

type ToastType = { message: string; type: "success" | "error" | "info" } | null;

export default function Training() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [races, setRaces] = useState<RaceRegistration[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [toast, setToast] = useState<ToastType>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRace, setEditingRace] = useState<RaceRegistration | null>(null);
  const [formData, setFormData] = useState<RaceFormData>({
    race_type: "running",
    race_name: "",
    race_date: "",
    distance: 0,
    location: "",
    registration_number: "",
    goal_time: "",
    notes: "",
    race_terrain: "road",
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

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

  const handleOpenModal = (race?: RaceRegistration) => {
    if (race) {
      setEditingRace(race);
      setFormData({
        race_type: race.race_type,
        race_name: race.race_name,
        race_date: race.race_date,
        distance: race.distance,
        location: race.location || "",
        registration_number: race.registration_number || "",
        goal_time: race.goal_time || "",
        notes: race.notes || "",
        race_terrain: race.race_terrain || "road",
      });
    } else {
      setEditingRace(null);
      setFormData({
        race_type: "running",
        race_name: "",
        race_date: "",
        distance: 0,
        location: "",
        registration_number: "",
        goal_time: "",
        notes: "",
        race_terrain: "road",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRace(null);
  };

  const handleSave = async () => {
    if (!formData.race_name.trim()) {
      setToast({ message: "Nome da prova é obrigatório", type: "error" });
      return;
    }

    if (!formData.race_date) {
      setToast({ message: "Data da prova é obrigatória", type: "error" });
      return;
    }

    if (!formData.distance || formData.distance <= 0) {
      setToast({ message: "Distância deve ser maior que 0", type: "error" });
      return;
    }

    setSaving(true);

    try {
      const method = editingRace ? "PUT" : "POST";
      const payload = editingRace
        ? { id: editingRace.id, ...formData }
        : formData;

      const response = await fetch("/api/races", {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar prova");
      }

      setToast({
        message: editingRace ? "Prova atualizada! ✅" : "Prova criada! ✅",
        type: "success",
      });

      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error("Error saving race:", error);
      setToast({ message: error.message || "Erro ao salvar prova", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (raceId: string, raceName: string) => {
    setDeleteConfirm({ id: raceId, name: raceName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/races?id=${deleteConfirm.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir prova");
      }

      setDeleteConfirm(null);
      setToast({ message: "Prova excluída", type: "info" });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting race:", error);
      setDeleteConfirm(null);
      setToast({ message: error.message || "Erro ao excluir prova", type: "error" });
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
              <p className="text-xs text-bark/60 font-body">Minhas Provas</p>
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
              title="Minhas Provas"
              aria-current="page"
            >
              <Trophy size={16} />
              <span className="hidden sm:inline">Minhas Provas</span>
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
            Minhas Provas
          </h2>
          <p className="text-bark/60 font-body text-sm mt-1">
            Suas provas e planos de treino personalizados
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

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteClick(race.id, race.race_name)}
                      className="p-2 text-bark/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Excluir prova"
                    >
                      <Trash2 size={18} />
                    </button>
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
                    {race.registration_number && (
                      <div className="flex items-center gap-2">
                        <Hash size={15} className="text-primary flex-shrink-0" />
                        <span>{race.registration_number}</span>
                      </div>
                    )}
                    {race.goal_time && (
                      <div className="flex items-center gap-2">
                        <Target size={15} className="text-primary flex-shrink-0" />
                        <span>Meta: {race.goal_time}</span>
                      </div>
                    )}
                    {race.result_time && (
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-green-600">{race.result_time}</span>
                      </div>
                    )}
                  </div>

                  {race.notes && (
                    <div className="mb-5 pt-3 border-t border-bark/10">
                      <p className="text-sm text-bark/60 italic">{race.notes}</p>
                    </div>
                  )}

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
                      onClick={() => handleOpenModal(race)}
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
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-white/90 hover:bg-white border border-primary/20 text-primary px-6 py-3 rounded-xl font-body font-semibold transition-colors shadow-sm"
            >
              <Plus size={18} />
              Cadastrar prova
            </button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display font-bold text-xl text-bark mb-2">Excluir prova?</h3>
            <p className="text-bark/60 font-body text-sm mb-6">
              Tem certeza que deseja excluir "<strong>{deleteConfirm.name}</strong>"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 rounded-xl font-body font-semibold text-bark bg-bark/5 hover:bg-bark/10 transition-colors"
              >Cancelar</button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-3 rounded-xl font-body font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-bark/10 p-6 flex items-center justify-between">
              <h2 className="font-display font-bold text-2xl text-bark">
                {editingRace ? "Editar Prova" : "Adicionar Prova"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-bark/60 hover:text-bark transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* DADOS OBRIGATÓRIOS */}
              <div>
                <h3 className="font-display font-bold text-lg text-bark mb-4 flex items-center gap-2">
                  📋 Dados Obrigatórios
                </h3>

                {/* Tipo de Prova - PRIMEIRO */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">Tipo de Prova *</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, race_type: "running" })}
                      className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                        formData.race_type === "running"
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-bark/20 text-bark hover:border-primary/40"
                      }`}
                    >🏃 Corrida</button>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 rounded-xl border font-semibold text-sm bg-bark/5 border-bark/10 text-bark/30 cursor-not-allowed"
                    >🏊 Triatlon <span className="text-xs">(em breve)</span></button>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 rounded-xl border font-semibold text-sm bg-bark/5 border-bark/10 text-bark/30 cursor-not-allowed"
                    >💪 Ironman <span className="text-xs">(em breve)</span></button>
                  </div>
                </div>

                {/* Nome da Prova */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">
                    Nome da Prova *
                  </label>
                  <input
                    type="text"
                    value={formData.race_name}
                    onChange={(e) =>
                      setFormData({ ...formData, race_name: e.target.value })
                    }
                    placeholder="Ex: Maratona do Rio 2026"
                    className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                  />
                </div>

                {/* Data */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.race_date}
                    onChange={(e) =>
                      setFormData({ ...formData, race_date: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                  />
                </div>

                {/* Distância */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">Distância *</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '5K', value: 5 },
                      { label: '10K', value: 10 },
                      { label: '13K', value: 13 },
                      { label: '15K', value: 15 },
                      { label: '18K', value: 18 },
                      { label: 'Meia Maratona (21.1km)', value: 21.1 },
                      { label: 'Maratona (42.2km)', value: 42.195 },
                    ].map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, distance: d.value })}
                        className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                          formData.distance === d.value
                            ? 'bg-accent text-bark border-accent'
                            : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                        }`}
                      >{d.label}</button>
                    ))}
                  </div>
                </div>

                {/* Terreno */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">Terreno</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'road', label: 'Asfalto' },
                      { value: 'trail', label: 'Trail' },
                      { value: 'mixed', label: 'Misto' },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, race_terrain: t.value })}
                        className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                          formData.race_terrain === t.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                        }`}
                      >{t.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEPARADOR */}
              <div className="border-t border-bark/10"></div>

              {/* DADOS OPCIONAIS */}
              <div>
                <h3 className="font-display font-bold text-lg text-bark mb-4 flex items-center gap-2">
                  📝 Dados Opcionais
                </h3>

                {/* Local */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-bark mb-2">
                    Local
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Ex: Rio de Janeiro, RJ"
                    className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                  />
                </div>

                {/* Nº de Peito e Tempo Objetivo */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-bark mb-2">
                      Nº de Peito
                    </label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_number: e.target.value,
                        })
                      }
                      placeholder="Ex: 1234"
                      className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-bark mb-2">
                      Tempo Objetivo
                    </label>
                    <input
                      type="text"
                      value={formData.goal_time}
                      onChange={(e) =>
                        setFormData({ ...formData, goal_time: e.target.value })
                      }
                      placeholder="HH:MM:SS"
                      className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-semibold text-bark mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notas, estratégia, preparação..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-bark/10 p-6 flex gap-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 rounded-xl font-body font-semibold text-bark bg-bark/5 hover:bg-bark/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl font-body font-semibold text-white bg-primary hover:bg-primary-600 disabled:bg-bark/20 transition-colors shadow-lg shadow-primary/20"
              >
                {saving ? "Salvando..." : editingRace ? "Atualizar" : "Salvar Prova"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
