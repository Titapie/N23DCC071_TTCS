import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BYPASS_AUTH } from "../utils/authMode";

export default function AdminRoute() {
  const { loading, user, isAuthenticated } = useAuth();

  if (BYPASS_AUTH) return <Outlet />;

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === "admin";
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
