import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { auth } = useAuth();
  if (!auth.ok) return <Navigate to="/login" replace />;
  return <Outlet />;
}
