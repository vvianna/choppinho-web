import { useState, useRef } from "react";
import { MessageCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setSessionToken } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "pin">("input");
  const [pinCode, setPinCode] = useState(["", "", "", "", "", ""]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        alert(data.error || "Erro ao enviar código. Tente novamente.");
        setLoading(false);
        return;
      }

      // Sucesso: mostrar tela de PIN
      setLoading(false);
      setStep("pin");
      // Auto-focus no primeiro campo do PIN
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } catch (error) {
      console.error("Error requesting magic link:", error);
      alert("Erro ao conectar com servidor. Tente novamente.");
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pinCode];
    newPin[index] = value;
    setPinCode(newPin);

    // Auto-focus no próximo campo
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }

    // Se preencheu todos os 6, fazer submit automaticamente
    if (index === 5 && value) {
      const fullPin = [...newPin.slice(0, 5), value].join("");
      handleVerifyPin(fullPin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinCode[index] && index > 0) {
      // Se está vazio e aperta backspace, volta pro anterior
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedText.length === 6) {
      const newPin = pastedText.split("");
      setPinCode(newPin);
      pinRefs.current[5]?.focus();
      // Verificar automaticamente
      handleVerifyPin(pastedText);
    }
  };

  const handleVerifyPin = async (pin: string) => {
    setLoading(true);

    try {
      const fullPhone = "+55" + phoneNumber.replace(/\D/g, "");

      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: fullPhone,
          pin_code: pin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || "Código inválido ou expirado");
        setPinCode(["", "", "", "", "", ""]);
        pinRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Salvar session token
      setSessionToken(data.session_token);

      // Redirecionar para dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error verifying PIN:", error);
      alert("Erro ao validar código. Tente novamente.");
      setLoading(false);
    }
  };

  const handleResend = () => {
    setPinCode(["", "", "", "", "", ""]);
    setStep("input");
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
                  Enviaremos um código de 6 dígitos via WhatsApp
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
                    Enviar Código
                  </>
                )}
              </button>
            </form>
          ) : (
            // PASSO 2: Digite o código PIN
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={32} className="text-primary" />
                </div>
                <h2 className="font-display font-bold text-xl text-bark mb-2">
                  Digite o código
                </h2>
                <p className="font-body text-bark/70 text-sm">
                  Enviamos um código de 6 dígitos para{" "}
                  <strong className="text-primary">+55 {phoneNumber}</strong>
                </p>
              </div>

              {/* Campos de PIN */}
              <div className="flex gap-2 justify-center">
                {pinCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    onPaste={index === 0 ? handlePinPaste : undefined}
                    disabled={loading}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-primary/20 rounded-xl focus:border-primary focus:outline-none transition-colors disabled:bg-bark/5"
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm font-body">Verificando...</span>
                </div>
              )}

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-bark/80 font-body text-center">
                  ⏰ O código expira em <strong>5 minutos</strong>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResend}
                  className="w-full text-sm text-bark/60 hover:text-bark font-body underline"
                >
                  Não recebeu? Enviar novo código
                </button>

                <div className="text-center">
                  <p className="text-xs text-bark/50 font-body mb-2">
                    Ou clique no link enviado via WhatsApp
                  </p>
                </div>
              </div>
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
