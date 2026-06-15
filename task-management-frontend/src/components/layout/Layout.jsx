import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
import MobileHeader from "./MobileHeader";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AIChatbox from "../common/AIChatbox";

export default function Layout() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-[#F6F7FB] dark:bg-slate-950">
      {/* ===== Desktop Sidebar ===== */}
      <aside
        className={`hidden lg:block shrink-0 h-screen transition-all duration-300 ${
          isCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>

      {/* ===== Mobile Sidebar Drawer ===== */}
      {openSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenSidebar(false)}
          />
          <div className="relative w-[260px] bg-white dark:bg-slate-900 h-screen shadow-xl">
            <Sidebar onClose={() => setOpenSidebar(false)} />
          </div>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Headers */}
        <div className="lg:hidden">
          <MobileHeader onOpenSidebar={() => setOpenSidebar(true)} />
        </div>
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
          <Outlet />
        </main>

        <Footer />
        <AIChatbox />
      </div>
    </div>
  );
}

