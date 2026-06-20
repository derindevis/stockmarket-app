// LSTM 30-day predicted price curve
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api";

export default function Forecast() {
  const [searchParams] = useSearchParams();
  const querySymbol = searchParams.get("symbol");

  const [symbol, setSymbol] = useState(querySymbol || "");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState(null);

  const handleGenerateForecast = async (e) => {
    if (e) e.preventDefault();
    if (!symbol.trim()) {
      setError("Please enter a stock symbol.");
      return;
    }

    setLoading(true);
    setError("");
    setForecastData(null);

    try {
      const res = await api.get(
        `/forecast/${symbol.trim().toUpperCase()}?days=${days}`,
      );
      setForecastData(res.data);
    } catch (err) {
      console.error("Error generating LSTM forecast:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to generate forecast. PyTorch LSTM requires at least 80 days of historical stock price data.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-run if symbol is in query params
  useEffect(() => {
    if (querySymbol) {
      setSymbol(querySymbol);
      // We need a short timeout to let the state update before executing
      const timer = setTimeout(() => {
        api
          .get(`/forecast/${querySymbol.toUpperCase()}?days=${days}`)
          .then((res) => setForecastData(res.data))
          .catch((err) => {
            console.error(err);
            setError(
              "Failed to generate automatic forecast. Check symbol history.",
            );
          });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [querySymbol]);

  const trendColor =
    forecastData?.trend === "uptrend"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : forecastData?.trend === "downtrend"
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          🔮 LSTM Price Forecasting
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Train a deep learning LSTM Neural Network on historical price closes
          to forecast future trends.
        </p>
      </div>

      {/* Control panel */}
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
        <form
          onSubmit={handleGenerateForecast}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
        >
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Stock Symbol
            </label>
            <input
              type="text"
              placeholder="e.g. MSFT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm font-semibold uppercase mt-1.5"
              required
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
              <span>Forecast Horizon</span>
              <span className="text-white font-bold">{days} Days</span>
            </div>
            <input
              type="range"
              min="7"
              max="90"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full accent-[#6366f1] h-1.5 bg-[#0a0a0f] rounded-lg appearance-none cursor-pointer mt-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold px-6 py-3 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {loading ? "🔮 Training LSTM Model..." : "🔮 Generate Forecast"}
          </button>
        </form>
        {loading && (
          <p className="text-xs text-indigo-400 mt-2.5 animate-pulse">
            ⚠️ Note: Training the recurrent neural network dynamically takes
            approximately 5 to 15 seconds. Please do not close this page.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-12 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6366f1] border-t-transparent"></div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">
              Training LSTM Neural Network
            </h3>
            <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
              Standardizing sequence matrices, applying Adam optimizer weights,
              and computing output standard deviation residuals.
            </p>
          </div>
        </div>
      )}

      {forecastData && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart card (Col span 2) */}
          <div className="lg:col-span-2 bg-[#12121a] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Projected Price Chart (95% CI)
              </h2>
              <span className="text-gray-400 text-xs font-semibold">
                Model: LSTM Recurrent Network
              </span>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecastData.forecast_points}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    style={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    domain={["auto", "auto"]}
                    style={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121a",
                      borderColor: "rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  {/* Confidence Interval Shaded Area */}
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="none"
                    fill="#6366f1"
                    fillOpacity={0.12}
                    name="Upper Bound (95% CI)"
                  />
                  {/* Predicted Line */}
                  <Area
                    type="monotone"
                    dataKey="predicted_price"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                    name="Predicted Close"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Statistics Panel */}
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Forecast Insights</h2>

            <div className="space-y-4">
              <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    Projected Trend
                  </span>
                  <div
                    className={`text-xl font-bold uppercase mt-1 ${forecastData.trend === "uptrend" ? "text-emerald-400" : forecastData.trend === "downtrend" ? "text-red-400" : "text-yellow-400"}`}
                  >
                    {forecastData.trend}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${trendColor}`}
                >
                  {forecastData.predicted_change_percent >= 0 ? "+" : ""}
                  {forecastData.predicted_change_percent}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-xl">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    Current Price
                  </span>
                  <div className="text-lg font-bold text-white mt-1">
                    ${forecastData.current_price?.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-xl">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    Model Conf.
                  </span>
                  <div className="text-lg font-bold text-white mt-1">
                    {forecastData.confidence}%
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-xl space-y-2.5">
                <span className="text-gray-400 text-xs uppercase tracking-wider">
                  Neural Network Parameters
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Architecture:</span>
                    <span className="text-gray-300 font-semibold">
                      Stacked LSTM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hidden Layers:</span>
                    <span className="text-gray-300 font-semibold">
                      2 Layers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hidden Units:</span>
                    <span className="text-gray-300 font-semibold">
                      64 Units per layer
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dropout Ratio:</span>
                    <span className="text-gray-300 font-semibold">0.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Optimizer:</span>
                    <span className="text-gray-300 font-semibold">
                      Adam (lr=0.001)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
