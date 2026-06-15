import { useState } from "react";
import { X, Lock } from "lucide-react";
import { authService } from "../../services/authService";
import Input from "../common/Input";

export default function ChangePasswordModal({ onClose }) {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(formData);
      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Change Password
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["oldPassword", "newPassword", "confirmPassword"].map((field) => (
            <div key={field}>
              <Input
                type="password"
                name={field}
                placeholder={
                  field === "oldPassword"
                    ? "Current Password"
                    : field === "newPassword"
                    ? "New Password"
                    : "Confirm New Password"
                }
                value={formData[field]}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          ))}

          {error && (
            <div className="text-red-500 text-sm font-medium px-1">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm font-medium px-1">
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
