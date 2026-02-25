import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 🎭 MOCK: Verifica se tem token no localStorage
    // Na versão real, valida o token no Supabase
    const token = localStorage.getItem("choppinho_session_token");
    setIsAuthenticated(!!token);
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Não autenticado → redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado → renderiza children
  return <>{children}</>;
}
