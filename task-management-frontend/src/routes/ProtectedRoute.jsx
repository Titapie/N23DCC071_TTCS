import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BYPASS_AUTH } from "../utils/authMode";

export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (BYPASS_AUTH) return <Outlet />;

  if (loading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
