import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import Input from "../common/Input";

export default function EditProfileModal({ onClose }) {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    FirstName: user?.FirstName || "",
    LastName: user?.LastName || "",
    avatar: user?.AvatarUrl || user?.avatar || "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Giới hạn kích thước ảnh (ví dụ: 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    try {
      await authService.updateProfile(formData);
      await refreshUser();
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      setError(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Edit Profile
        </h3>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {/* Avatar Upload */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-200 flex items-center justify-center">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-slate-400">
                  {(formData.FirstName?.[0] || "U").toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Camera size={16} />
            </button>
<input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First Name"
            value={formData.FirstName}
            onChange={(e) =>
              setFormData({ ...formData, FirstName: e.target.value })
            }
            className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <Input
            placeholder="Last Name"
            value={formData.LastName}
            onChange={(e) =>
              setFormData({ ...formData, LastName: e.target.value })
            }
            className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}