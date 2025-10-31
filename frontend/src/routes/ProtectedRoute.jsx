import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { auth, loading } = useAuth();
  const location = useLocation();

  // Enquanto valida credenciais salvas
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-black/10 bg-white/80 backdrop-blur px-4 py-3 shadow">
          Verificando sessão…
        </div>
      </div>
    );
  }

  // Não autenticado → envia para /login e guarda a rota de origem
  if (!auth?.ok) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Autenticado → renderiza as rotas filhas (ex.: AdminProducts)
  return <Outlet />;
}
