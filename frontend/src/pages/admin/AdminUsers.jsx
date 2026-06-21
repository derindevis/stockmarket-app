import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../api";
import { useAuth } from "../../AuthContext";

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching admin users:", err);
      setError("Failed to retrieve user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    if (user.id === currentAdmin.id) {
      alert("You cannot deactivate your own administrative profile!");
      return;
    }

    setUpdatingId(user.id);
    try {
      const nextStatus = !user.is_active;
      await api.put(`/admin/users/${user.id}/status`, {
        is_active: nextStatus,
      });

      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, is_active: nextStatus } : u,
        ),
      );
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Failed to update user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          👥 User Administration
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Review user roles, creation timestamps, and manage user statuses.
        </p>
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
      ) : (
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0d14] text-gray-400 font-semibold">
                  <th className="p-4">ID</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => {
                  const isSelf = u.id === currentAdmin.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.01]">
                      <td className="p-4 font-mono text-xs text-gray-500">
                        #{u.id}
                      </td>
                      <td className="p-4 font-bold text-white text-base">
                        {u.username}{" "}
                        {isSelf && (
                          <span className="text-xs text-gray-500 font-normal ml-1">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-semibold ${u.role === "admin" ? "bg-indigo-500/15 text-indigo-400" : "bg-gray-800 text-gray-400"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${u.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                        >
                          {u.is_active ? "ACTIVE" : "DEACTIVATED"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf || updatingId === u.id}
                          className={`text-xs font-bold border px-3 py-1.5 rounded-lg transition-all ${isSelf ? "border-gray-800 text-gray-600 cursor-not-allowed" : u.is_active ? "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/25" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25"}`}
                        >
                          {updatingId === u.id
                            ? "Updating..."
                            : u.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
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
