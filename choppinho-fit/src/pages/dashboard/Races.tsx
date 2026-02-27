import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Trophy,
  Target,
  Clock,
  Hash,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { getAuthHeaders, clearSession } from "../../lib/auth";
import { RaceRegistration, RaceFormData } from "../../lib/types";
import Toast from "../../components/Toast";

type ToastType = { message: string; type: "success" | "error" | "info" } | null;

export default function Races() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [races, setRaces] = useState<RaceRegistration[]>([]);
  const [toast, setToast] = useState<ToastType>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRace, setEditingRace] = useState<RaceRegistration | null>(null);

  // Form state
  const [formData, setFormData] = useState<RaceFormData>({
    race_type: "running",
    race_name: "",
    race_date: "",
    distance: 0,
    location: "",
    registration_number: "",
    goal_time: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const response = await fetch("/api/races", {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        clearSession();
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao carregar provas");
      }

      setRaces(data.data.races);
    } catch (error: any) {
      console.error("Error fetching races:", error);
      setToast({ message: error.message || "Erro ao carregar provas", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (race?: RaceRegistration) => {
    if (race) {
      // Editar
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
      });
    } else {
      // Criar nova
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
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRace(null);
  };

  const handleSave = async () => {
    // Validações
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
      fetchRaces(); // Recarregar lista
    } catch (error: any) {
      console.error("Error saving race:", error);
      setToast({ message: error.message || "Erro ao salvar prova", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (raceId: string, raceName: string) => {
    if (!confirm(`Deseja realmente excluir "${raceName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/races?id=${raceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir prova");
      }

      setToast({ message: "Prova excluída", type: "info" });
      fetchRaces(); // Recarregar lista
    } catch (error: any) {
      console.error("Error deleting race:", error);
      setToast({ message: error.message || "Erro ao excluir prova", type: "error" });
    }
  };

  const getRaceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      running: "🏃 Corrida",
      triathlon: "🏊 Triatlon",
      ironman: "💪 Ironman",
    };
    return labels[type] || type;
  };

  const getRaceTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      running: "bg-orange-100 text-orange-700",
      triathlon: "bg-blue-100 text-blue-700",
      ironman: "bg-red-100 text-red-700",
    };
    return colors[type] || "bg-bark/10 text-bark";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      upcoming: { label: "Próxima", color: "bg-green-100 text-green-700" },
      completed: { label: "Concluída", color: "bg-blue-100 text-blue-700" },
      cancelled: { label: "Cancelada", color: "bg-bark/10 text-bark/60" },
    };
    return badges[status] || { label: status, color: "bg-bark/10 text-bark" };
  };

  const getDaysUntilRace = (raceDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const race = new Date(raceDate + "T00:00:00");
    const diffTime = race.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="text-bark/60 font-body">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-bark/60 hover:text-bark transition-colors flex-shrink-0"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-bark truncate">
                Provas Inscritas
              </h1>
              <p className="text-bark/60 font-body text-sm">
                {races.length} prova{races.length !== 1 ? "s" : ""} cadastrada{races.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-4 sm:px-6 py-3 rounded-xl font-body font-semibold shadow-lg shadow-primary/20 transition-colors flex-shrink-0"
            title="Adicionar Prova"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Adicionar Prova</span>
          </button>
        </div>

        {/* Lista de Provas */}
        {races.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center border border-primary/10">
            <Trophy size={48} className="mx-auto text-bark/20 mb-4" />
            <p className="text-bark/60 font-body">
              Nenhuma prova cadastrada ainda.
            </p>
            <p className="text-bark/40 font-body text-sm mt-2">
              Clique em "Adicionar Prova" para começar!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {races.map((race) => {
              const daysUntil = getDaysUntilRace(race.race_date);
              const statusBadge = getStatusBadge(race.status);

              return (
                <div
                  key={race.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRaceTypeBadgeColor(
                            race.race_type
                          )}`}
                        >
                          {getRaceTypeLabel(race.race_type)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-bark mb-1 break-words">
                        {race.race_name}
                      </h3>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(race)}
                        className="p-2 text-bark/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(race.id, race.race_name)}
                        className="p-2 text-bark/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-bark/70">
                      <Calendar size={16} className="text-primary" />
                      <div>
                        <div className="font-semibold">{formatDate(race.race_date)}</div>
                        {race.status === "upcoming" && daysUntil >= 0 && (
                          <div className="text-xs text-bark/50">
                            {daysUntil === 0 ? "Hoje!" : daysUntil === 1 ? "Amanhã" : `Faltam ${daysUntil} dias`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-bark/70">
                      <Trophy size={16} className="text-primary" />
                      <span className="font-semibold">{race.distance} km</span>
                    </div>

                    {race.location && (
                      <div className="flex items-center gap-2 text-bark/70">
                        <MapPin size={16} className="text-primary" />
                        <span>{race.location}</span>
                      </div>
                    )}

                    {race.registration_number && (
                      <div className="flex items-center gap-2 text-bark/70">
                        <Hash size={16} className="text-primary" />
                        <span>{race.registration_number}</span>
                      </div>
                    )}

                    {race.goal_time && (
                      <div className="flex items-center gap-2 text-bark/70">
                        <Target size={16} className="text-primary" />
                        <span>Meta: {race.goal_time}</span>
                      </div>
                    )}

                    {race.result_time && (
                      <div className="flex items-center gap-2 text-bark/70">
                        <Clock size={16} className="text-green-600" />
                        <span className="font-semibold text-green-600">
                          {race.result_time}
                        </span>
                      </div>
                    )}
                  </div>

                  {race.notes && (
                    <div className="mt-4 pt-4 border-t border-bark/10">
                      <p className="text-sm text-bark/60 italic">{race.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  <label className="block text-sm font-semibold text-bark mb-2">
                    Tipo de Prova *
                  </label>
                  <select
                    value={formData.race_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        race_type: e.target.value as "running" | "triathlon" | "ironman",
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                  >
                    <option value="running">🏃 Corrida</option>
                    <option value="triathlon">🏊 Triatlon</option>
                    <option value="ironman">💪 Ironman</option>
                  </select>
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

                {/* Data e Distância */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
                    <label className="block text-sm font-semibold text-bark mb-2">
                      Distância (km) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.distance || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          distance: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ex: 42.2"
                      className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
                    />
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
