import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'

export default function Watchlist() {
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingSymbol, setRemovingSymbol] = useState(null)

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist')
      setWatchlist(res.data)
      setError('')
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setError('Failed to load watchlist items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const handleRemove = async (symbol) => {
    setRemovingSymbol(symbol)
    try {
      await api.delete(`/watchlist/${symbol}`)
      setWatchlist(watchlist.filter(item => item.symbol !== symbol))
    } catch (err) {
      console.error('Error removing from watchlist:', err)
    } finally {
      setRemovingSymbol(null)
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-wide">⭐ My Watchlist</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all text-sm font-medium"
        >
          🔍 Search Stocks
        </button>
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
      ) : watchlist.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-[#12121a] border border-white/[0.08] rounded-xl p-8"
        >
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-lg font-bold text-white mb-2">Watchlist is Empty</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            You haven't added any stocks to your watchlist yet. Search for symbols to track real-time changes and analyze trends.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-white/[0.1] text-gray-300 px-6 py-2.5 rounded-lg hover:bg-white/[0.05] transition-all text-sm"
          >
            Go to Dashboard
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#12121a] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">{item.symbol}</h3>
                    <p className="text-gray-400 text-xs mt-1 truncate max-w-[200px]">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">
                      {item.current_price ? `$${item.current_price.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-gray-500 text-[10px] uppercase mt-4">
                  Added on: {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => navigate(`/stocks/${item.symbol}`)}
                  className="flex-1 bg-[#1e1e2d] text-gray-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all text-xs font-semibold border border-white/[0.05]"
                >
                  📈 Analyze
                </button>
                <button
                  onClick={() => handleRemove(item.symbol)}
                  disabled={removingSymbol === item.symbol}
                  className="bg-red-500/15 text-red-400 border border-red-500/25 px-3 py-2 rounded-lg hover:bg-red-500/25 transition-all text-xs font-semibold"
                >
                  {removingSymbol === item.symbol ? 'Removing...' : '🗑️'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
