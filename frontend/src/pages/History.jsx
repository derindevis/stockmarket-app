// Review your past stock analyses and generated technical reports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/history");
        setHistory(res.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to fetch analysis history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleClearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear your entire analysis history? This cannot be undone.",
      )
    )
      return;
    try {
      setError("");
      await api.delete("/history");
      setHistory([]);
    } catch (err) {
      console.error("Error clearing history:", err);
      setError("Failed to clear analysis history.");
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            📜 Analysis History
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review your past stock analyses and generated technical reports.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="self-start sm:self-center bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/25 transition-all text-xs font-bold"
          >
            Clear History
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
        </div>
      ) : history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-[#12121a] border border-white/[0.08] rounded-xl p-8"
        >
          <div className="text-5xl mb-4">📜</div>
          <h2 className="text-lg font-bold text-white mb-2">
            No History Found
          </h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            You haven't run any stock analyses yet. Head over to the dashboard
            to search for a stock and calculate its indicators.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-6 py-2.5 rounded-lg hover:brightness-110 transition-all text-sm font-semibold"
          >
            Run First Analysis
          </button>
        </motion.div>
      ) : (
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0d14] text-gray-400 font-semibold">
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Signal</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">RSI (14)</th>
                  <th className="p-4">MACD</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {history.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const badgeColor =
                    item.signal === "BUY"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : item.signal === "SELL"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400";

                  return (
                    <>
                      <tr
                        key={item.id}
                        onClick={() => toggleExpand(item.id)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-all border-b border-white/[0.03]"
                      >
                        <td className="p-4 font-bold text-white text-base">
                          {item.symbol}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}
                          >
                            {item.signal}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">
                          {item.confidence}%
                        </td>
                        <td className="p-4 text-gray-300">
                          {item.rsi?.toFixed(1) || "N/A"}
                        </td>
                        <td className="p-4 text-gray-300">
                          {item.macd?.toFixed(3) || "N/A"}
                        </td>
                        <td className="p-4 text-gray-400 text-xs">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stocks/${item.symbol}`);
                            }}
                            className="text-[#6366f1] hover:underline text-xs font-bold mr-4"
                          >
                            Analyze Live
                          </button>
                          <span className="text-gray-500 text-xs select-none">
                            {isExpanded ? "▲ Hide" : "▼ Details"}
                          </span>
                        </td>
                      </tr>
                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr
                          key={`${item.id}-details`}
                          className="bg-[#0c0c14]/40 border-b border-white/[0.05]"
                        >
                          <td colSpan="7" className="p-5 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500 uppercase">
                                  SMA 20:
                                </span>
                                <p className="font-semibold text-white mt-0.5">
                                  ${item.moving_average?.toFixed(2) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase">
                                  Beta vs SPY:
                                </span>
                                <p className="font-semibold text-white mt-0.5">
                                  {item.beta?.toFixed(2) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase">
                                  P/E Ratio:
                                </span>
                                <p className="font-semibold text-white mt-0.5">
                                  {item.pe_ratio?.toFixed(1) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase">
                                  Sharpe Ratio:
                                </span>
                                <p className="font-semibold text-white mt-0.5">
                                  {item.sharpe_ratio?.toFixed(2) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase">
                                  Volatility:
                                </span>
                                <p className="font-semibold text-white mt-0.5">
                                  {item.volatility?.toFixed(1) || "N/A"}%
                                </p>
                              </div>
                            </div>

                            <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-lg">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                                AI Analysis Explanation
                              </h4>
                              <p className="text-xs text-gray-400 leading-relaxed font-normal">
                                {item.ai_explanation}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
