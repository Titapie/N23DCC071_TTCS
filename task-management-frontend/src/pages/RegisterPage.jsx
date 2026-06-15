import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import { authService } from "../services/authService";
import { useToast } from "../hooks/useToast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleRegister = async (data) => {
    setLoading(true);
    setError("");
    try {
      await authService.register(data);
      setEmail(data.email);
      setStep(2);
      showToast("Mã OTP đã được gửi đến email của bạn!", "success");
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.verifyRegistration({ email, otp });
      showToast("Kích hoạt tài khoản thành công!", "success");
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Mã OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-[520px] bg-white border border-slate-200 rounded-2xl px-8 py-9 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
        <h1 className="text-[32px] font-bold text-slate-900 leading-tight">
          {step === 1 ? "Tạo tài khoản" : "Xác thực OTP"}
        </h1>
        <p className="mt-2 mb-6 text-slate-500">
          {step === 1 
            ? "Nhập thông tin cá nhân để bắt đầu." 
            : `Nhập mã OTP 6 số đã được gửi tới ${email}`}
        </p>

        {step === 1 ? (
          <RegisterForm
            onSubmit={handleRegister}
            loading={loading}
            error={error}
          />
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mã OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold tracking-[10px] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Đang xác thực..." : "Kích hoạt tài khoản"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-slate-500 hover:text-slate-800"
            >
              Quay lại
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-slate-600">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
