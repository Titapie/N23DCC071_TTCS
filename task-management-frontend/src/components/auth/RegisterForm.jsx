"use client";

import { useState } from "react";
import Input from "../common/Input";

// ─── Validate mật khẩu theo rule backend ───────────────────
const checkPassword = (password) => {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
};

const isPasswordValid = (checks) =>
  checks.length && checks.upper && checks.lower && checks.digit;

export default function RegisterForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const pwChecks = checkPassword(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setValidationError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Validate mật khẩu đầy đủ
    if (!isPasswordValid(pwChecks)) {
      setValidationError(
        "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số."
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Mật khẩu xác nhận không khớp");
      return;
    }

    onSubmit({ firstName, lastName, email: email.trim().toLowerCase(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Họ</label>
          <Input
            variant="light"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Nguyễn"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tên</label>
          <Input
            variant="light"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Văn A"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <Input
          variant="light"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="Email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
        <Input
          variant="light"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          autoComplete="new-password"
          placeholder="Mật khẩu"
        />

        {/* Password strength indicator — hiện khi có nội dung */}
        {(passwordFocused || formData.password.length > 0) && (
          <div className="mt-2 space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Yêu cầu mật khẩu:</p>
            {[
              { key: "length", label: "Ít nhất 8 ký tự" },
              { key: "upper",  label: "Có ít nhất 1 chữ hoa (A-Z)" },
              { key: "lower",  label: "Có ít nhất 1 chữ thường (a-z)" },
              { key: "digit",  label: "Có ít nhất 1 chữ số (0-9)" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                    pwChecks[key]
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {pwChecks[key] ? "✓" : "✗"}
                </span>
                <span
                  className={`text-xs ${
                    pwChecks[key] ? "text-green-700" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
        <Input
          variant="light"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
        />
      </div>

      {(error || validationError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error || validationError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
      </button>
    </form>
  );
}
