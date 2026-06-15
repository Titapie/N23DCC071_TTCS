import { useState } from "react";
import { Link } from "react-router-dom";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { authService } from "../services/authService";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset, 3: Success
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetData, setResetData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleForgotPassword = async (emailInput) => {
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword({ email: emailInput });
      setEmail(emailInput);
      setStep(2);
    } catch (err) {
      console.error("Lỗi quên mật khẩu:", err);
      if (err.response && err.response.status === 500) {
        setError(
          "Lỗi hệ thống (500). Vui lòng kiểm tra log server hoặc thử lại sau."
        );
      } else {
        setError(err?.response?.data?.message || "Gửi yêu cầu thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if(!email){
        setError("Không tìm thấy email");
      }
      await authService.resetPassword({ 
        email: email,
        otp: resetData.otp,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword
      });
      setStep(3);
    } catch (err) {
      console.error("Lỗi đặt lại mật khẩu:", err);
      setError(err?.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-[520px] bg-white border border-slate-200 rounded-2xl px-8 py-9 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
        <h1 className="text-[32px] font-bold text-slate-900 leading-tight">
          {step === 1 && "Quên mật khẩu?"}
          {step === 2 && "Đặt lại mật khẩu"}
          {step === 3 && "Thành công"}
        </h1>
        <p className="mt-2 mb-6 text-slate-500">
          {step === 1 && "Nhập email của bạn để nhận mã OTP đặt lại mật khẩu."}
          {step === 2 && "Nhập mã OTP đã được gửi đến email và mật khẩu mới."}
          {step === 3 && "Mật khẩu của bạn đã được đặt lại thành công."}
        </p>

        {step === 3 ? (
          <div className="text-center">
            <div className="mb-6 text-green-700 bg-green-50 p-4 rounded-xl border border-green-200 font-medium">
              Mật khẩu đã được thay đổi. Bạn có thể đăng nhập ngay bây giờ.
            </div>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : step === 2 ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã OTP
              </label>
              <input
                type="text"
                variant="light"
                value={resetData.otp}
                onChange={(e) =>
                  setResetData({ ...resetData, otp: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                placeholder="Nhập mã OTP"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
              variant="light"
                type="password"
                value={resetData.newPassword}
                onChange={(e) =>
                  setResetData({ ...resetData, newPassword: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                placeholder="Nhập mật khẩu mới"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
              variant="light"
                type="password"
                value={resetData.confirmPassword}
                onChange={(e) =>
                  setResetData({
                    ...resetData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-70"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Gửi lại mã?
              </button>
            </div>
          </form>
        ) : (
          <>
            <ForgotPasswordForm
              onSubmit={handleForgotPassword}
              loading={loading}
              error={error}
            />
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
