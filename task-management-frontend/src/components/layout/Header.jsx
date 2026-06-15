import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <header className="h-[80px] bg-white dark:bg-slate-950 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col">
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-white leading-tight">
            {loading
              ? "Loading..."
              : user
                ? `Hi, ${
                    user.FullName ||
                    (user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : "User")
                  } 👋`
                : "Welcome back"}
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
            Hãy hoàn thành nhiệm vụ của bạn ngay hôm nay!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-transparent dark:bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 bg-transparent dark:bg-transparent rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
              {user?.AvatarUrl || user?.avatar ? (
                <img
                  src={user.AvatarUrl || user.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm">
                  {(user?.FullName || user?.firstName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden sm:block max-w-[100px] truncate">
              {user?.FullName || user?.firstName || "User"}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
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
    </header>
  );
}
