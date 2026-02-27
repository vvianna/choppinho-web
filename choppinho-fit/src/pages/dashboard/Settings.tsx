import { useState, useEffect } from "react";
import { User, Smile, Settings as SettingsIcon, LogOut, X } from "lucide-react";
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

  // Buscar perfil do usuário
  useEffect(() => {
    fetchProfile();
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

        {/* Botões de ação */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary-600 disabled:bg-bark/20 text-white px-6 py-4 rounded-xl font-display font-bold text-lg transition-colors shadow-lg shadow-primary/20"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-display font-bold transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
