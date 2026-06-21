import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'

export default function Compare() {
  const navigate = useNavigate()
  const [symbols, setSymbols] = useState(['', ''])
  const [compareData, setCompareData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddTicker = () => {
    if (symbols.length < 4) {
      setSymbols([...symbols, ''])
    }
  }

  const handleRemoveTicker = (index) => {
    if (symbols.length > 2) {
      const updated = [...symbols]
      updated.splice(index, 1)
      setSymbols(updated)
    }
  }

  const handleSymbolChange = (index, value) => {
    const updated = [...symbols]
    updated[index] = value.toUpperCase()
    setSymbols(updated)
  }

  const handleCompare = async (e) => {
    e.preventDefault()
    const cleanSymbols = symbols.map(s => s.trim()).filter(s => s !== '')
    if (cleanSymbols.length < 2) {
      setError('Please enter at least 2 symbols to compare.')
      return
    }

    setLoading(true)
    setError('')
    setCompareData(null)

    try {
      const res = await api.post('/compare', { symbols: cleanSymbols })
      setCompareData(res.data.stocks)
    } catch (err) {
      console.error('Error comparing stocks:', err)
      setError(err.response?.data?.detail || 'Failed to compare stocks. Verify all symbols are correct.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">📊 Stock Comparison</h1>
        <p className="text-gray-400 text-sm mt-1">Compare up to 4 stocks side-by-side using technical and key metrics.</p>
      </div>

      {/* Compare Forms */}
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {symbols.map((sym, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Stock Symbol ${index + 1} (e.g. AAPL)`}
                  value={sym}
                  onChange={(e) => handleSymbolChange(index, e.target.value)}
                  className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all w-full text-sm font-semibold uppercase"
                  required
                />
                {symbols.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTicker(index)}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-all text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleAddTicker}
              disabled={symbols.length >= 4}
              className="text-gray-400 text-sm font-medium hover:text-white transition-all disabled:opacity-40"
            >
              ➕ Add another stock ({symbols.length}/4)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium px-6 py-2.5 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300 disabled:opacity-50 text-sm"
            >
              {loading ? 'Comparing...' : '📊 Compare Now'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
          <p className="text-gray-400 text-sm animate-pulse">Fetching comparison metrics...</p>
        </div>
      )}

      {/* Comparison Results */}
      {compareData && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white">Analysis Matrix</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0d14]">
                  <th className="p-4 font-semibold text-gray-400">Metric</th>
                  {compareData.map((stock) => (
                    <th key={stock.symbol} className="p-4 font-bold text-white text-center">
                      <div className="text-base">{stock.symbol}</div>
                      <div className="text-[11px] text-gray-400 font-normal truncate max-w-[120px] mx-auto mt-0.5">{stock.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Current Price</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-bold text-white">${stock.price?.toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Day Change %</td>
                  {compareData.map((stock) => {
                    const isPos = stock.change_percent >= 0
                    return (
                      <td key={stock.symbol} className={`p-4 text-center font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">RSI (14)</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded ${stock.rsi > 70 ? 'bg-red-500/10 text-red-400' : stock.rsi < 30 ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-300'}`}>
                        {stock.rsi?.toFixed(1)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">MACD Line</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center text-white">{stock.macd?.toFixed(3)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Beta vs SPY</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center text-white">{stock.beta?.toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Annualized Volatility</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center text-white">{stock.volatility?.toFixed(1)}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Sharpe Ratio</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center font-semibold text-white">{stock.sharpe_ratio?.toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">P/E Ratio</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center text-white">{stock.pe_ratio?.toFixed(1) || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Market Cap</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center text-white">
                      {stock.market_cap ? `$${(stock.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#0c0c14]/30">
                  <td className="p-4 font-semibold text-gray-400">AI Signal</td>
                  {compareData.map((stock) => {
                    const badgeColor = 
                      stock.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                      stock.signal === 'SELL' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    return (
                      <td key={stock.symbol} className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                          {stock.signal} ({stock.confidence}%)
                        </span>
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-gray-400">Details</td>
                  {compareData.map((stock) => (
                    <td key={stock.symbol} className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/stocks/${stock.symbol}`)}
                        className="text-[#6366f1] hover:underline text-xs font-bold"
                      >
                        View Full Analysis
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
