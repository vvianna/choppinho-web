import { useState, useEffect } from "react";
import { User, Smile, Settings as SettingsIcon, LogOut, X, Activity as ActivityIcon, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearSession } from "../../lib/auth";
import type { User as UserType } from "../../lib/types";
import Toast from "../../components/Toast";

type ToastType = {
  message: string;
  type: "success" | "error" | "info";
} | null;

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [toast, setToast] = useState<ToastType>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [newNickname, setNewNickname] = useState("");
  const [personalityMode, setPersonalityMode] = useState<"default" | "offensive" | "light_zen">("default");
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [city, setCity] = useState('');

  // Strava state
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaAthleteId, setStravaAthleteId] = useState<number | null>(null);
  const [stravaLastSync, setStravaLastSync] = useState<string | null>(null);
  const [stravaTotalActivities, setStravaTotalActivities] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Buscar perfil do usuário e status do Strava
  useEffect(() => {
    fetchProfile();
    fetchStravaStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Erro ao buscar perfil");
      }

      const userData = data.data.user;
      setUser(userData);
      setFirstName(userData.first_name || "");
      setEmail(userData.email || "");
      setNicknames(userData.nicknames || []);
      setPersonalityMode(userData.personality_mode || "default");
      setAge(userData.age || '');
      setGender(userData.gender || '');
      setWeight(userData.weight || '');
      setHeight(userData.height || '');
      setCity(userData.city || '');
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setToast({ message: "Erro ao carregar perfil", type: "error" });
      setLoading(false);
    }
  };

  const handleAddNickname = () => {
    const trimmed = newNickname.trim();

    if (!trimmed) {
      setToast({ message: "Digite um apelido", type: "error" });
      return;
    }

    if (trimmed.length > 30) {
      setToast({ message: "Apelido deve ter no máximo 30 caracteres", type: "error" });
      return;
    }

    if (nicknames.length >= 10) {
      setToast({ message: "Máximo 10 apelidos permitidos", type: "error" });
      return;
    }

    if (nicknames.includes(trimmed)) {
      setToast({ message: "Esse apelido já existe", type: "info" });
      return;
    }

    setNicknames([...nicknames, trimmed]);
    setNewNickname("");
    setToast({ message: "Apelido adicionado!", type: "success" });
  };

  const handleRemoveNickname = (index: number) => {
    setNicknames(nicknames.filter((_, i) => i !== index));
    setToast({ message: "Apelido removido", type: "info" });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          email: email || null,
          nicknames,
          personality_mode: personalityMode,
          age: Number(age) || null,
          gender: gender || null,
          weight: Number(weight) || null,
          height: Number(height) || null,
          city: city || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar");
      }

      setToast({ message: "Perfil atualizado com sucesso! ✅", type: "success" });
      fetchProfile(); // Recarregar dados
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setToast({ message: error.message || "Erro ao salvar perfil", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      clearSession();
      navigate("/login");
    }
  };

  const fetchStravaStatus = async () => {
    try {
      const response = await fetch("/api/strava/status", {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Erro ao buscar status do Strava");
      }

      setStravaConnected(data.data.connected);
      setStravaAthleteId(data.data.athlete_id);
      setStravaLastSync(data.data.last_sync);
      setStravaTotalActivities(data.data.total_activities);
    } catch (error) {
      console.error("Error fetching Strava status:", error);
      // Não mostrar toast aqui, apenas log
    }
  };

  const handleSync = async () => {
    if (!stravaConnected) {
      setToast({ message: "Strava não está conectado", type: "error" });
      return;
    }

    setSyncing(true);

    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao sincronizar");
      }

      setToast({ message: "Sincronização concluída! ✅", type: "success" });
      fetchStravaStatus(); // Recarregar status
    } catch (error: any) {
      console.error("Error syncing Strava:", error);
      setToast({ message: error.message || "Erro ao sincronizar", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Deseja realmente desconectar o Strava?")) {
      return;
    }

    try {
      const response = await fetch("/api/strava/disconnect", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao desconectar");
      }

      setToast({ message: "Strava desconectado", type: "info" });
      fetchStravaStatus(); // Recarregar status
    } catch (error: any) {
      console.error("Error disconnecting Strava:", error);
      setToast({ message: error.message || "Erro ao desconectar", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 pb-12">
      <div className="grain-overlay" />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-bark/60 hover:text-primary transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="font-display font-bold text-xl text-primary">
            Configurações
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Perfil */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={24} className="text-primary" />
            </div>
            <h2 className="font-display font-bold text-xl text-bark">Perfil</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-body font-semibold text-bark mb-2">
                Nome
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary focus:outline-none font-body"
              />
            </div>

            <div>
              <label className="block font-body font-semibold text-bark mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary focus:outline-none font-body"
              />
            </div>

            <div>
              <label className="block font-body font-semibold text-bark mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={user?.phone_number || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-bark/10 bg-bark/5 text-bark/60 font-body cursor-not-allowed"
              />
              <p className="text-xs text-bark/50 mt-1">
                Telefone não pode ser alterado
              </p>
            </div>
          </div>
        </div>

        {/* Dados Físicos */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <h3 className="font-display font-bold text-lg text-bark mb-4 flex items-center gap-2">
            📏 Dados Físicos
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-bark mb-2">Idade</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 34"
                className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-bark mb-2">Gênero</label>
              <div className="flex gap-2">
                {[
                  { value: 'm', label: 'Masculino' },
                  { value: 'f', label: 'Feminino' },
                  { value: 'o', label: 'Outro' },
                ].map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`flex-1 px-3 py-3 rounded-xl border font-semibold text-sm transition-all ${
                      gender === g.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-bark/20 text-bark hover:border-primary/40'
                    }`}
                  >{g.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-bark mb-2">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 78"
                className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-bark mb-2">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 176"
                className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-bark mb-2">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Rio de Janeiro"
                className="w-full px-4 py-3 rounded-xl border border-bark/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-body"
              />
            </div>
          </div>
        </div>

        {/* Apelidos */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
              <Smile size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-bark">
                Apelidos
              </h2>
              <p className="text-sm text-bark/60">
                O Choppinho vai usar esses apelidos nas mensagens
              </p>
            </div>
          </div>

          {/* Lista de apelidos */}
          <div className="flex flex-wrap gap-2 mb-4">
            {nicknames.length === 0 ? (
              <p className="text-bark/50 text-sm italic">
                Nenhum apelido adicionado ainda
              </p>
            ) : (
              nicknames.map((nick, index) => (
                <div
                  key={index}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-2 font-body"
                >
                  <span>{nick}</span>
                  <button
                    onClick={() => handleRemoveNickname(index)}
                    className="text-primary hover:text-primary-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Input para adicionar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Monstro, Fera, Campeão..."
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddNickname()}
              maxLength={30}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-primary/20 focus:border-primary focus:outline-none font-body"
            />
            <button
              onClick={handleAddNickname}
              disabled={nicknames.length >= 10}
              className="bg-primary hover:bg-primary-600 disabled:bg-bark/20 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-body font-semibold transition-colors"
            >
              Adicionar
            </button>
          </div>

          <p className="text-xs text-bark/50 mt-2">
            Máximo 10 apelidos. Cada um pode ter até 30 caracteres.
          </p>
        </div>

        {/* Personalidade */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <SettingsIcon size={24} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-bark">
                Personalidade do Bot
              </h2>
              <p className="text-sm text-bark/60">
                Escolha como o Choppinho vai te falar
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary/40 cursor-pointer transition-colors">
              <input
                type="radio"
                name="personality"
                value="default"
                checked={personalityMode === "default"}
                onChange={(e) => setPersonalityMode(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="font-body font-semibold text-bark">
                  Default (Equilibrado)
                </div>
                <div className="text-sm text-bark/60">
                  Mensagens motivacionais e amigáveis
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary/40 cursor-pointer transition-colors">
              <input
                type="radio"
                name="personality"
                value="offensive"
                checked={personalityMode === "offensive"}
                onChange={(e) => setPersonalityMode(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="font-body font-semibold text-bark">
                  Offensive (Zoação Pesada) 🔥
                </div>
                <div className="text-sm text-bark/60">
                  Prepare-se para levar porrada (com amor)
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary/40 cursor-pointer transition-colors">
              <input
                type="radio"
                name="personality"
                value="light_zen"
                checked={personalityMode === "light_zen"}
                onChange={(e) => setPersonalityMode(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="font-body font-semibold text-bark">
                  Light Zen (Motivacional Leve) 🧘
                </div>
                <div className="text-sm text-bark/60">
                  Mensagens suaves e inspiradoras
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Strava */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <ActivityIcon size={24} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-bark">
                Strava
              </h2>
              <p className="text-sm text-bark/60">
                Sincronize suas atividades automaticamente
              </p>
            </div>
          </div>

          {stravaConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-body font-semibold">Conectado</span>
              </div>

              <div className="bg-bark/5 rounded-xl p-4 space-y-2 text-sm text-bark/70 font-body">
                <div className="flex justify-between">
                  <span>Atleta ID:</span>
                  <span className="font-semibold text-bark">{stravaAthleteId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de atividades:</span>
                  <span className="font-semibold text-bark">{stravaTotalActivities}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última sincronização:</span>
                  <span className="font-semibold text-bark">
                    {stravaLastSync
                      ? new Date(stravaLastSync).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-bark/20 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors"
                >
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Sincronizando..." : "Sincronizar Agora"}
                </button>

                <button
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700 font-body text-sm underline"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-bark/60">
                <XCircle size={20} />
                <span className="font-body">Strava não conectado</span>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-bark/80 font-body">
                  Conecte sua conta Strava para sincronizar suas corridas automaticamente e visualizar suas estatísticas no dashboard.
                </p>
              </div>

              <button
                disabled
                className="bg-bark/20 cursor-not-allowed text-bark/40 px-6 py-3 rounded-xl font-body font-semibold"
              >
                Conectar Strava (em breve)
              </button>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary-600 disabled:bg-bark/20 text-white px-6 py-4 rounded-xl font-display font-bold text-base sm:text-lg transition-colors shadow-lg shadow-primary/20"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-display font-bold transition-colors flex items-center justify-center gap-2"
            title="Sair"
          >
            <LogOut size={20} />
            <span className="sm:hidden">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
