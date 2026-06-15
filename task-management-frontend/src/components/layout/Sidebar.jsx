import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  Users,

  X,
  ChevronLeft,
  ChevronRight, Briefcase,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ onClose, isCollapsed, toggleSidebar }) {
  const { user } = useAuth();

  const menu = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/projects", label: "Projects", icon: Briefcase },
    { to: "/tasks", label: "Task", icon: ClipboardList },
    { to: "/kanban", label: "Kanban", icon: ClipboardList },
    { to: "/profile", label: "Profile", icon: Users },
  ];

  // Thêm menu Admin nếu là admin
  if (user?.role === 'admin') {
    menu.push({ to: "/admin/dashboard", label: "Admin Panel", icon: ShieldAlert });
  }

  return (
    <aside
      className={`w-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 min-h-screen py-6 flex flex-col transition-all duration-300 relative  ${isCollapsed ? "px-3" : "px-3"
        }`}
    >
      {/* Toggle Button (Desktop only) */}
      {!onClose && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3.5 top-9 z-50 w-7 h-7 p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md hover:shadow-lg transition-all duration-200"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}



      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"
          } mb-10 px-2 transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            AA
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap overflow-hidden">
              AA
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all
              ${isCollapsed ? "justify-center px-0" : ""}
              ${isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`
            }
          >
            <item.icon size={20} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}