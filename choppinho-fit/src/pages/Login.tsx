import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Smartphone } from "lucide-react";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "sent">("input");
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é número
    let value = e.target.value.replace(/\D/g, "");

    // Limita a 11 dígitos (DDD + número)
    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    // Formata: (21) 96707-6547
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      }
    }

    setPhoneNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      alert("Por favor, digite um número de telefone válido");
      return;
    }

    setLoading(true);

    try {
      // Formatar número completo com +55
      const fullPhone = "+55" + phoneNumber.replace(/\D/g, "");

      // Chamar API real
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: fullPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || "Erro ao enviar magic link. Tente novamente.");
        setLoading(false);
        return;
      }

      // Sucesso: mostrar tela de "link enviado"
      setLoading(false);
      setStep("sent");
    } catch (error) {
      console.error("Error requesting magic link:", error);
      alert("Erro ao conectar com servidor. Tente novamente.");
      setLoading(false);
    }
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
                  <span className="absolute left-12 top-1/2 -translate-y-1/2 text-bark font-body font-semibold">
                    +55
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="(21) 96707-6547"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className="w-full pl-20 pr-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary focus:outline-none font-body transition-colors"
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
                  <strong className="text-primary">+55 {phoneNumber}</strong> no
                  WhatsApp.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-bark/80 font-body">
                  ⏰ O link expira em <strong>15 minutos</strong>. Se não
                  receber, tente novamente.
                </p>
              </div>

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
