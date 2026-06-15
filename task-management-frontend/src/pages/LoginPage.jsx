import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import { useToast } from "../hooks/useToast";
import { BYPASS_AUTH } from "../utils/authMode";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!BYPASS_AUTH && !loading && user) {
    const role = String(user?.role ?? "").toLowerCase();
    return <Navigate to={role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setSubmitting(true);
      const userData = await login({
        email: email.trim(),
        password: password,
      });
      showToast("Đăng nhập thành công!", "success");
      
      // Chuyển hướng dựa trên role
      const role = String(userData?.role ?? "").toLowerCase();
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-[520px] bg-white border border-slate-200 rounded-2xl px-8 py-9 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
        {/* Title */}
        <h1 className="text-[32px] font-bold text-slate-900 leading-tight">
          Đăng nhập tài khoản
        </h1>
        <p className="mt-2 mb-6 text-slate-500">
          Nhập email và mật khẩu để tiếp tục.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block mb-1.5 font-semibold text-slate-900">
              Email
            </label>
            <Input
              variant="light"
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1.5 font-semibold text-slate-900">
              Mật khẩu
            </label>
            <Input
              variant="light"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Forgot */}
          <div className="flex justify-end">
            <Link
              to="/forgotpassword"
              className="font-semibold text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white
                       hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-slate-600">
          Bạn chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* {BYPASS_AUTH && (
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link
              to="/dashboard"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Vào Dashboard (không cần đăng nhập)
            </Link>
          </p>
        )} */}
      </div>
    </div>
  );
}
