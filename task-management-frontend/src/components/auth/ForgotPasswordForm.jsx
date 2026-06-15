"use client";

import { useState } from "react";
import Input from "../common/Input";

export default function ForgotPasswordForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <Input
        variant="light"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="Email"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang gửi yêu cầu..." : "Gửi liên kết đặt lại mật khẩu"}
      </button>
    </form>
  );
}
