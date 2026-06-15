// src/routes/ManagerRoute.jsx
// Chặn người chưa đăng nhập và role "employee" truy cập trang dành cho manager/admin
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BYPASS_AUTH } from "../utils/authMode";
import { hasManagerRole, isAdmin } from "../utils/roleUtils";

export default function ManagerRoute() {
  const { loading, user, isAuthenticated } = useAuth();

  if (BYPASS_AUTH) return <Outlet />;

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Chỉ cho phép admin và manager (hỗ trợ multi-role: roles=['employee','manager'])
  const isAllowed = isAdmin(user) || hasManagerRole(user);
  if (!isAllowed) {
    // Employee thuần túy hoặc role không hợp lệ → về dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
