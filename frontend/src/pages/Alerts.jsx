import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");

  // Form states
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] = useState("rsi_threshold");
  const [threshold, setThreshold] = useState("");

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/alerts");
      setAlerts(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to fetch alert configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || !threshold) {
      setError("Please fill in all fields.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/alerts", {
        symbol: symbol.trim().toUpperCase(),
        alert_type: alertType,
        threshold: parseFloat(threshold),
      });
      setAlerts([res.data, ...alerts]);
      setSuccess(`Alert created for ${symbol.toUpperCase()}!`);
      setSymbol("");
      setThreshold("");
    } catch (err) {
      console.error("Error creating alert:", err);
      setError(err.response?.data?.detail || "Failed to create alert.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await api.delete(`/alerts/${alertId}`);
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          🔔 Indicator Alerts
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure automated notifications based on key technical indicator
          values.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Create Alert Form */}
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-white">Create New Alert</h2>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                Stock Symbol
              </label>
              <input
                type="text"
                placeholder="e.g. AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm font-semibold uppercase mt-1.5"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                Indicator Type
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm mt-1.5"
              >
                <option value="rsi_threshold">RSI Threshold</option>
                <option value="volatility_spike">Volatility Spike (%)</option>
                <option value="signal_change">Signal Change (Crossover)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                Threshold Value
              </label>
              <input
                type="number"
                step="any"
                placeholder={
                  alertType === "rsi_threshold"
                    ? "e.g. 30"
                    : alertType === "volatility_spike"
                      ? "e.g. 45"
                      : "e.g. 1"
                }
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm mt-1.5"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium px-6 py-3 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300 disabled:opacity-50 text-sm w-full font-semibold"
            >
              {creating ? "Creating..." : "🔔 Create Alert"}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs">
              {success}
            </div>
          )}
        </div>

        {/* Right Side (Span 2): Active Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">
            Active Alerts ({alerts.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-24 bg-[#12121a] border border-white/[0.08] rounded-xl p-8">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">
                No active alert configurations found. Set up alerts on the left
                to monitor metric thresholds.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((item, index) => {
                const label =
                  item.alert_type === "rsi_threshold"
                    ? "RSI Threshold"
                    : item.alert_type === "volatility_spike"
                      ? "Volatility Spike"
                      : "Signal Change";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-300 flex justify-between items-start"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white tracking-wide">
                          {item.symbol}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${item.is_triggered ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`}
                        ></span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1 font-semibold">
                        {label}
                      </p>
                      <div className="text-xs text-gray-500 mt-4">
                        Threshold:{" "}
                        <span className="font-semibold text-white">
                          {item.threshold}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase mt-0.5">
                        Status:{" "}
                        <span
                          className={
                            item.is_triggered
                              ? "text-emerald-400"
                              : "text-yellow-400"
                          }
                        >
                          {item.is_triggered ? "Triggered" : "Monitoring"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(item.id)}
                      className="text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 p-2 rounded-lg transition-all text-xs"
                    >
                      Delete
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
