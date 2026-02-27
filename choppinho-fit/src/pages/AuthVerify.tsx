import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setSessionToken } from "../lib/auth";

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );

  useEffect(() => {
    // Aceitar tanto 'token' (longo) quanto 'c' (curto - magic link)
    const token = searchParams.get("token") || searchParams.get("c");

    if (!token) {
      setStatus("error");
      return;
    }

    // Verificar token via API
    const verifyToken = async () => {
      try {
        // Usar 'c' se foi esse o parâmetro recebido, senão usar 'token'
        const paramName = searchParams.get("c") ? "c" : "token";
        const response = await fetch(`/api/auth/verify?${paramName}=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setStatus("error");
          return;
        }

        // Salvar session token no localStorage
        setSessionToken(data.session_token);

        setStatus("success");

        // Redirecionar para dashboard após 1.5s
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Error verifying token:", error);
        setStatus("error");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center px-4">
      <div className="grain-overlay" />

      <div className="max-w-md w-full relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-primary/10 text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
              <h2 className="font-display font-bold text-xl text-bark mb-2">
                Verificando...
              </h2>
              <p className="font-body text-bark/70">
                Aguarde enquanto validamos seu acesso
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-bark mb-2">
                Acesso confirmado! ✅
              </h2>
              <p className="font-body text-bark/70">
                Redirecionando para seu dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-bark mb-2">
                Link inválido ❌
              </h2>
              <p className="font-body text-bark/70 mb-6">
                O link pode ter expirado ou é inválido.
              </p>
              <a
                href="/login"
                className="inline-block bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-display font-bold transition-colors"
              >
                Tentar novamente
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
