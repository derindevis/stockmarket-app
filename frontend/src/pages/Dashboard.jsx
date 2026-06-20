// Search entry page with quick pills
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";
import api from "../api";

const quickStocks = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "TSLA",
  "AMZN",
  "RELIANCE.NS",
  "TCS.NS",
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [watchlistMsg, setWatchlistMsg] = useState("");

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const res = await api.get("/history", { params: { limit: 5 } });
      setRecentAnalyses(res.data?.analyses || res.data || []);
    } catch {
      // Silently fail
    } finally {
      setRecentLoading(false);
    }
  };

  const handleSearch = async (symbol) => {
    const searchSymbol = symbol || query.trim().toUpperCase();
    if (!searchSymbol) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    setWatchlistMsg("");
    try {
      const res = await api.get(`/stocks/search`, {
        params: { q: searchSymbol },
      });
      setSearchResult(res.data);
    } catch (err) {
      setSearchError(
        err.response?.data?.detail ||
          "Stock not found. Please check the symbol.",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const addToWatchlist = async (symbol) => {
    try {
      await api.post("/watchlist", { symbol });
      setWatchlistMsg(`${symbol} added to watchlist!`);
      setTimeout(() => setWatchlistMsg(""), 3000);
    } catch (err) {
      setWatchlistMsg(
        err.response?.data?.detail || "Failed to add to watchlist",
      );
    }
  };

  const getSignalBadge = (signal) => {
    if (!signal) return null;
    const s = signal.toUpperCase();
    if (s === "BUY")
      return (
        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
          BUY
        </span>
      );
    if (s === "SELL")
      return (
        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
          SELL
        </span>
      );
    return (
      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
        HOLD
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-6 space-y-6"
    >
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
            {user?.username}
          </span>{" "}
          👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Search for any stock to get AI-powered analysis
        </p>
      </div>

      {/* Search */}
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL, GOOGL, RELIANCE.NS)"
            className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-lg"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium px-8 py-3 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300 disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
          >
            {searchLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>🔍 Search</>
            )}
          </button>
        </form>

        {/* Quick pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-gray-500 text-sm py-1">Quick:</span>
          {quickStocks.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                handleSearch(s);
              }}
              className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-400 text-sm hover:bg-[#6366f1]/10 hover:text-[#818cf8] hover:border-[#6366f1]/30 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Error */}
      {searchError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {searchError}
        </div>
      )}

      {/* Watchlist message */}
      {watchlistMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-sm">
          {watchlistMsg}
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {searchResult.name || searchResult.symbol}
              </h2>
              <p className="text-gray-400 text-sm">{searchResult.symbol}</p>
              {searchResult.price != null && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-bold text-white">
                    ${Number(searchResult.price).toFixed(2)}
                  </span>
                  {searchResult.change != null && (
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        searchResult.change >= 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {searchResult.change >= 0 ? "+" : ""}
                      {Number(searchResult.change).toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/stocks/${searchResult.symbol}`)}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium px-6 py-3 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300"
              >
                📐 Analyze
              </button>
              <button
                onClick={() => addToWatchlist(searchResult.symbol)}
                className="border border-white/[0.1] text-gray-300 px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
              >
                ⭐ Watchlist
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Analyses */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Analyses
        </h2>
        {recentLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent" />
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <span className="text-4xl block mb-3">🔍</span>
            <p>No recent analyses. Search for a stock to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAnalyses.slice(0, 6).map((a, i) => (
              <motion.div
                key={a._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/stocks/${a.symbol}`)}
                className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold group-hover:text-[#818cf8] transition-colors">
                    {a.symbol}
                  </span>
                  {getSignalBadge(a.signal)}
                </div>
                {a.confidence != null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Confidence</span>
                      <span>{Number(a.confidence).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all"
                        style={{ width: `${Math.min(a.confidence, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {a.date && (
                  <p className="text-gray-500 text-xs mt-3">
                    {new Date(a.date).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
