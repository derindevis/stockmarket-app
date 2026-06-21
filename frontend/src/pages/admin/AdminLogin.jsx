import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(username, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Admin authentication failed. Access denied.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#12121a] border border-white/[0.08] rounded-xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="text-4xl inline-block">🛠️</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Admin Access Portal
          </h1>
          <p className="text-gray-400 text-sm">
            Enter administrative credentials to access platform configurations.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm font-semibold mt-1.5"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm font-semibold mt-1.5"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-bold py-3 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? "Authenticating..." : "🔑 Authorize & Enter"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs text-gray-500 hover:text-gray-300 hover:underline"
          >
            ← Back to Standard Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
