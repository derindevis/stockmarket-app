// Account profile details view
import { useAuth } from '../AuthContext'
import { motion } from 'framer-motion'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">👤 User Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Review your login credentials, role assignments, and security details.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden p-6 space-y-6"
      >
        <div className="flex items-center gap-4 border-b border-white/[0.06] pb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-[#6366f1]/25">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{user?.username}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">User Role</span>
            <div className="mt-1 flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${user?.role === 'admin' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25 shadow-sm' : 'text-gray-400 bg-white/[0.03] border-white/[0.06]'}`}>
                {user?.role || 'User'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Member Since</span>
            <div className="mt-1 text-sm font-semibold text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </div>
          </div>

          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Account Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-semibold text-white">Active</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Database Key (Local)</span>
            <div className="mt-1 text-xs font-mono text-gray-500 break-all select-none">
              LOCAL_SQLITE_STORAGE_PROVIDER_ACTIVE
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}