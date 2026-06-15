import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Moon,
  Sun,
  Search,
  User,
  LogOut,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

export default function MobileHeader({ onOpenSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="
        flex items-center justify-between gap-4
        bg-white dark:bg-slate-900
        p-4 rounded-2xl lg:hidden
        shadow-sm transition-colors
        border border-slate-100 dark:border-slate-800
      "
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>

        <div className="relative flex-1 max-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full h-10 pl-10 pr-4 rounded-xl text-sm
              bg-slate-50 dark:bg-slate-800
              text-slate-900 dark:text-white
              placeholder-slate-400
              outline-none focus:ring-2 focus:ring-indigo-500/20
              transition-all
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-transparent dark:bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 dark:border-slate-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {user?.AvatarUrl || user?.avatar ? (
              <img
                src={user.AvatarUrl || user.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm">
                {(user?.FullName || user?.firstName || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.FullName ||
                    (user?.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : "User")}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              <div className="px-2 py-1">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-xl transition-colors"
                >
                  <User size={18} />
                  <span>Hồ sơ của tôi</span>
                </Link>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
