import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../AuthContext";

const navItems = [
  { path: "/dashboard", icon: "🏠", label: "Dashboard" },
  { path: "/watchlist", icon: "⭐", label: "Watchlist" },
  { path: "/compare", icon: "📊", label: "Compare" },
  { path: "/history", icon: "📜", label: "History" },
  { path: "/alerts", icon: "🔔", label: "Alerts" },
  { path: "/forecasts", icon: "🔮", label: "Forecasts" },
  { path: "/profile", icon: "👤", label: "Profile" },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.08]">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <span className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
            StockSense
          </span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Admin
              </span>
            </div>
            <NavLink
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`
              }
            >
              <span className="text-lg">🛡️</span>
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-semibold text-sm">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username || "User"}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                user?.role === "admin"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-[#6366f1]/20 text-[#818cf8]"
              }`}
            >
              {user?.role || "user"}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/30 transition-all duration-200"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#12121a] border border-white/[0.08] text-white md:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] min-h-screen bg-[#12121a] border-r border-white/[0.08] fixed top-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 w-[280px] h-full bg-[#12121a] border-r border-white/[0.08] z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
