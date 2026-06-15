import { useState } from "react";
import { Mail, Phone, MapPin, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

export default function UserProfile({ isMobile = false }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Tên hiển thị - backend trả firstName, lastName
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.FullName || 'User';

  // Avatar
  const avatarUrl = user?.avatar || user?.AvatarUrl;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6 shadow-sm border border-slate-100 dark:border-slate-800 ${
        isMobile ? "" : "max-w-xl"
      }`}
    >
      {/* Avatar & Name */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          ) : (
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Shield size={14} className="text-blue-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
              {user?.role || "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <Mail size={18} />
          </div>
          <span className="text-sm font-medium">
            {/* Backend trả user.email (chữ thường) */}
            {user?.email || 'Chưa có email'}
          </span>
        </div>

        {/* Hiển thị Phone/Address nếu có trong tương lai */}
        {user?.Phone && (
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Phone size={18} />
            </div>
            <span className="text-sm font-medium">{user.Phone}</span>
          </div>
        )}
        {user?.Address && (
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <MapPin size={18} />
            </div>
            <span className="text-sm font-medium">{user.Address}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20"
        >
          Edit Profile
        </button>
        <button
          onClick={() => setIsChangingPassword(true)}
          className="w-full py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
        >
          Change Password
        </button>
      </div>

      {/* Modals */}
      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
      {isChangingPassword && (
        <ChangePasswordModal onClose={() => setIsChangingPassword(false)} />
      )}
    </div>
  );
}
