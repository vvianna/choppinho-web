import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Smartphone } from "lucide-react";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "sent">("input");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      alert("Por favor, digite seu número de telefone");
      return;
    }

    setLoading(true);

    // 🎭 MOCK: Simula envio do magic link
    setTimeout(() => {
      setLoading(false);
      setStep("sent");
    }, 1500);
  };

  const handleMockLogin = () => {
    // 🎭 MOCK: Simula clique no magic link
    // Na versão real, isso vem do WhatsApp
    const mockToken = "mock-token-" + Date.now();

    // Salva token fake no localStorage (simula sessão)
    localStorage.setItem("choppinho_session_token", mockToken);
    localStorage.setItem("choppinho_user_phone", phoneNumber);

    // Redireciona para dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center px-4">
      <div className="grain-overlay" />

      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/choppinho-mascot.png"
              alt="Choppinho"
              className="w-16 h-16 rounded-full border-2 border-primary/30 animate-float object-cover mix-blend-multiply"
            />
            <h1 className="font-display font-bold text-3xl text-primary">
              Choppinho<span className="text-accent">Fit</span>
            </h1>
          </div>
          <p className="font-body text-bark/70">
            Entre para acessar seu dashboard
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-primary/10">
          {step === "input" ? (
            // PASSO 1: Input de telefone
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block font-body font-semibold text-bark mb-2"
                >
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <Smartphone
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-bark/40"
                  />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+55 21 96707-6547"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary focus:outline-none font-body transition-colors"
                  />
                </div>
                <p className="text-sm text-bark/60 mt-2">
                  Enviaremos um link de acesso via WhatsApp
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 disabled:bg-bark/20 text-white px-6 py-4 rounded-xl font-display font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} />
                    Enviar Link
                  </>
                )}
              </button>
            </form>
          ) : (
            // PASSO 2: Link enviado (mock)
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle size={32} className="text-green-600" />
              </div>

              <div>
                <h2 className="font-display font-bold text-xl text-bark mb-2">
                  Link enviado! 📱
                </h2>
                <p className="font-body text-bark/70">
                  Enviamos um link de acesso para{" "}
                  <strong className="text-primary">{phoneNumber}</strong> no
                  WhatsApp.
                </p>
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-bark/80 font-body">
                  ⚠️ <strong>MODO DEMO:</strong> Este é um mock para testar a
                  UI. Clique no botão abaixo para simular o acesso via magic
                  link.
                </p>
              </div>

              {/* 🎭 MOCK: Botão para simular clique no magic link */}
              <button
                onClick={handleMockLogin}
                className="w-full bg-accent hover:bg-accent-600 text-bark px-6 py-4 rounded-xl font-display font-bold text-lg transition-colors shadow-lg shadow-accent/20"
              >
                🎭 Simular Magic Link (Demo)
              </button>

              <button
                onClick={() => setStep("input")}
                className="text-sm text-bark/60 hover:text-bark font-body underline"
              >
                Tentar outro número
              </button>
            </div>
          )}
        </div>

        {/* Link para voltar */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-bark/60 hover:text-primary font-body text-sm transition-colors"
          >
            ← Voltar para home
          </a>
        </div>
      </div>
    </div>
  );
}
