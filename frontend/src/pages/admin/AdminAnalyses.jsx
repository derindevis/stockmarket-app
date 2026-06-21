import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api'

export default function AdminAnalyses() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await api.get('/admin/analyses')
        setAnalyses(res.data)
      } catch (err) {
        console.error('Error fetching admin analyses:', err)
        setError('Failed to fetch platform prediction logs.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalyses()
  }, [])

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">📜 Platform Technical Analyses</h1>
        <p className="text-gray-400 text-sm mt-1">Audit runs of indicator models and signal recommendations triggered by users.</p>
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
      ) : analyses.length === 0 ? (
        <div className="text-center py-24 bg-[#12121a] border border-white/[0.08] rounded-xl p-8">
          <div className="text-5xl mb-4">📜</div>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            No analyses have been logged on the platform yet.
          </p>
        </div>
      ) : (
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0d14] text-gray-400 font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Signal</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">RSI (14)</th>
                  <th className="p-4">MACD</th>
                  <th className="p-4">SMA 20</th>
                  <th className="p-4">Beta</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {analyses.map((item) => {
                  const badgeColor = 
                    item.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.signal === 'SELL' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01]">
                      <td className="p-4 text-white font-semibold">{item.username}</td>
                      <td className="p-4 font-bold text-white text-base">{item.symbol}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                          {item.signal}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-white">{item.confidence}%</td>
                      <td className="p-4 text-gray-400">{item.rsi?.toFixed(1) || 'N/A'}</td>
                      <td className="p-4 text-gray-400">{item.macd?.toFixed(3) || 'N/A'}</td>
                      <td className="p-4 text-gray-400">${item.moving_average?.toFixed(2) || 'N/A'}</td>
                      <td className="p-4 text-gray-400">{item.beta?.toFixed(2) || 'N/A'}</td>
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
