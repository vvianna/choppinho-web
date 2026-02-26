import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    // Verifica se tem session token válido
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setHasAuth(authenticated);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Loading state enquanto verifica autenticação
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-primary/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Não autenticado → redireciona para login
  if (!hasAuth) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado → renderiza children
  return <>{children}</>;
}
