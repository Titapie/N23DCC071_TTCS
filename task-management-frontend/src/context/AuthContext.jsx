import { createContext, useEffect, useState, useMemo, useRef } from "react";
import { authService } from "../services/authService";
import { tokenStore } from "../utils/api";
import { useTheme } from "./ThemeContext";

/* ================= CONTEXT ================= */
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

/* ================= PROVIDER ================= */
export const AuthProvider = ({ children }) => {
  const { setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  /* ================= INIT AUTH ================= */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initAuth = async () => {
      try {
        const accessToken = tokenStore.getAccessToken();
        console.log("[AuthContext] initAuth - Token exists:", !!accessToken);
        if (!accessToken) {
          setLoading(false);
          return;
        }

        const res = await authService.me();
        const userData = res.data || res; // Xử lý trường hợp API trả về { data: user }
        console.log("[AuthContext] initAuth - User loaded:", userData);
        setUser(userData);
      } catch (error) {
        console.error("[AuthContext] initAuth - Error:", error);
        tokenStore.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* ================= LOGIN ================= */
  const login = async (credentials) => {
    console.log("[AuthContext] login - Credentials:", credentials);
    try {
      const res = await authService.login(credentials);
      console.log("[AuthContext] login - Response:", res);

      // Hỗ trợ cả accessToken (chuẩn) và token (tùy biến) từ BE
      const accessToken = res.accessToken || res.token;
      if (accessToken) tokenStore.setAccessToken(accessToken);
      if (res.refreshToken) tokenStore.setRefreshToken(res.refreshToken);

      const resMe = await authService.me();
      const userData = resMe.data || resMe;
      console.log("[AuthContext] login - User Data:", userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("[AuthContext] login - Error:", error);
      tokenStore.clear();
      setUser(null);
      throw error; // Ném lỗi gốc để LoginPage hiển thị message từ BE
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    console.log("[AuthContext] logout");
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenStore.clear();
      setTheme("light");
      setUser(null);
    }
  };

  /* ================= REFRESH USER ================= */
  const refreshUser = async () => {
    try {
      const res = await authService.me();
      const userData = res.data || res;
      setUser(userData);
    } catch (error) {
      console.error("Refresh user failed", error);
    }
  };

  /* ================= CONTEXT VALUE ================= */
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
