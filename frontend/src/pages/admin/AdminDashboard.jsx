import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError(
          "Failed to fetch platform metrics. Verify your administrative rights.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            🛠️ Platform Administration
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor platform usage metrics, user accounts, and technical runs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-[#1e1e2d] border border-white/[0.05] text-gray-300 px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all text-xs font-semibold"
          >
            👥 Manage Users
          </button>
          <button
            onClick={() => navigate("/admin/analyses")}
            className="bg-[#1e1e2d] border border-white/[0.05] text-gray-300 px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all text-xs font-semibold"
          >
            📜 View Analyses
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5"
          >
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Total Users
            </span>
            <div className="text-3xl font-extrabold text-white mt-1.5">
              {stats.total_users}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">
              registered profiles
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5"
          >
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Active Sessions
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1.5">
              {stats.active_users}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">
              unlocked accounts
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5"
          >
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Total Analyses
            </span>
            <div className="text-3xl font-extrabold text-white mt-1.5">
              {stats.total_analyses}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">
              computations saved
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5"
          >
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Triggered Alerts
            </span>
            <div className="text-3xl font-extrabold text-white mt-1.5">
              {stats.total_alerts}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">
              alert rules set
            </p>
          </motion.div>
        </div>
      )}

      {/* Bottom Layout: Top Stocks & Admin Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Searched Stocks */}
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            🔥 Top Searched Stocks
          </h2>
          {stats?.top_stocks.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-6">
              No search statistics logged yet.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {stats?.top_stocks.map((stock, i) => (
                <div
                  key={stock.symbol}
                  className="flex justify-between items-center py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-semibold w-5">
                      #{i + 1}
                    </span>
                    <span className="font-bold text-white">{stock.symbol}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10">
                    {stock.count} runs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database Stats info */}
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">
              ⚙️ Server Status
            </h2>
            <p className="text-gray-400 text-xs font-normal leading-relaxed mb-4">
              The platform database is currently hosted locally on a SQLite
              flat-file instance (`stockdata.db`). Access tokens are encrypted
              using HS256 JWT protocols with a secret signature hashing phrase.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/[0.04] pb-2">
                <span className="text-gray-500">Security Provider:</span>
                <span className="text-gray-300 font-semibold">
                  passlib / jose-cryptography
                </span>
              </div>
              <div className="flex justify-between border-b border-white/[0.04] pb-2">
                <span className="text-gray-500">FastAPI Version:</span>
                <span className="text-gray-300 font-semibold">
                  0.109.0 (Uvicorn HTTP Engine)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Framework:</span>
                <span className="text-gray-300 font-semibold">
                  PyTorch LSTM Recurrent Model
                </span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/[0.04] mt-6 flex justify-between">
            <span className="text-gray-500 text-xs self-center">
              API Host: http://localhost:8000
            </span>
            <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
