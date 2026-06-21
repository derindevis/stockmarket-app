import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'
import StockChart from '../components/StockChart'
import IndicatorCharts from '../components/IndicatorCharts'

export default function StockAnalysis() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  
  const [period, setPeriod] = useState('1mo')
  const [details, setDetails] = useState(null)
  const [history, setHistory] = useState([])
  const [analysis, setAnalysis] = useState(null)
  
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  
  const [watchlistAdding, setWatchlistAdding] = useState(false)
  const [watchlistMessage, setWatchlistMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingDetails(true)
      try {
        const res = await api.get(`/stocks/${symbol}`)
        setDetails(res.data)
        setError('')
      } catch (err) {
        console.error('Error fetching stock details:', err)
        setError('Failed to fetch stock details. Please check the symbol and try again.')
      } finally {
        setLoadingDetails(false)
      }
    }

    const runAnalysis = async () => {
      setLoadingAnalysis(true)
      try {
        const res = await api.get(`/stocks/${symbol}/analysis`)
        setAnalysis(res.data)
      } catch (err) {
        console.error('Error running stock analysis:', err)
      } finally {
        setLoadingAnalysis(false)
      }
    }

    if (symbol) {
      fetchDetails()
      runAnalysis()
    }
  }, [symbol])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true)
      try {
        const res = await api.get(`/stocks/${symbol}/history?period=${period}`)
        setHistory(res.data)
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }

    if (symbol) {
      fetchHistory()
    }
  }, [symbol, period])

  const handleAddToWatchlist = async () => {
    setWatchlistAdding(true)
    setWatchlistMessage('')
    try {
      await api.post('/watchlist', { symbol })
      setWatchlistMessage('Successfully added to Watchlist!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to watchlist'
      setWatchlistMessage(msg)
    } finally {
      setWatchlistAdding(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="border border-white/[0.1] text-gray-300 px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const changeIsPositive = details?.change >= 0
  const signalColor = 
    analysis?.signal === 'BUY' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    analysis?.signal === 'SELL' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'

  return (
    <div className="min-h-screen p-6 space-y-6 bg-[#0a0a0f] text-gray-200">
      {/* Stock Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#12121a] border border-white/[0.08] rounded-xl p-6 gap-4"
      >
        {loadingDetails ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-gray-700 rounded"></div>
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{details?.symbol}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${changeIsPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                {changeIsPositive ? '+' : ''}{details?.change_percent?.toFixed(2)}%
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{details?.name}</p>
          </div>
        )}

        {loadingDetails ? (
          <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-white">${details?.price?.toFixed(2)}</div>
              <div className={`text-sm font-semibold ${changeIsPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {changeIsPositive ? '+' : ''}{details?.change?.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAddToWatchlist}
                disabled={watchlistAdding}
                className="border border-white/[0.1] text-gray-300 px-4 py-2.5 rounded-lg hover:bg-white/[0.05] transition-all text-sm font-medium"
              >
                {watchlistAdding ? 'Adding...' : '⭐ Watchlist'}
              </button>
              <button
                onClick={() => navigate(`/forecasts?symbol=${symbol}`)}
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-4 py-2.5 rounded-lg hover:brightness-110 transition-all text-sm font-medium"
              >
                🔮 AI Forecast
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {watchlistMessage && (
        <div className="p-3 bg-white/[0.05] border border-white/[0.08] text-sm text-center rounded-lg text-indigo-400">
          {watchlistMessage}
        </div>
      )}

      {/* Main Grid: Left Side details/chart, Right Side recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Price Chart & Key Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart Card */}
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Price Chart</h2>
              {/* Period Selectors */}
              <div className="flex bg-[#0a0a0f] border border-white/[0.08] p-1 rounded-lg text-xs">
                {['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-md transition-all font-medium uppercase ${period === p ? 'bg-[#6366f1] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px]">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
                </div>
              ) : (
                <StockChart data={history} height={400} />
              )}
            </div>
          </div>

          {/* Key Statistics Grid */}
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Key Statistics</h2>
            
            {loadingDetails ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 bg-gray-700 rounded"></div>
                    <div className="h-6 w-24 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Open</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.open_price?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Prev Close</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.previous_close?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Day High</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.day_high?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Day Low</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.day_low?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">52W High</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.fifty_two_week_high?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">52W Low</div>
                  <div className="text-xl font-bold text-white mt-1">${details?.fifty_two_week_low?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">P/E Ratio</div>
                  <div className="text-xl font-bold text-white mt-1">{details?.pe_ratio?.toFixed(2) || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Volume</div>
                  <div className="text-xl font-bold text-white mt-1">{details?.volume?.toLocaleString() || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1): Recommendation & AI Explanation */}
        <div className="space-y-6">
          {/* Recommendation Card */}
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">AI Analysis & Suggestion</h2>

            {loadingAnalysis ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent"></div>
                <p className="text-gray-400 text-sm animate-pulse">Running technical indicator model...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recommendation Signal */}
                <div className={`border rounded-xl p-4 text-center ${signalColor}`}>
                  <div className="text-xs uppercase font-semibold tracking-widest text-gray-400 mb-1">Recommendation</div>
                  <div className="text-4xl font-extrabold tracking-wide">{analysis?.signal}</div>
                </div>

                {/* Confidence Meter */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Model Confidence</span>
                    <span className="font-semibold text-white">{analysis?.confidence}%</span>
                  </div>
                  <div className="w-full bg-[#0a0a0f] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${analysis?.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* AI Explanation Text */}
                <div className="bg-[#0a0a0f] border border-white/[0.05] p-4 rounded-xl space-y-2">
                  <h3 className="text-sm font-semibold text-white">Technical Justification:</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{analysis?.ai_explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Indicators Grid */}
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Technical Values</h2>

            {loadingAnalysis ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between h-4 bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">RSI (14)</span>
                  <span className={`font-semibold ${analysis?.indicators.rsi > 70 ? 'text-red-400' : analysis?.indicators.rsi < 30 ? 'text-emerald-400' : 'text-white'}`}>
                    {analysis?.indicators.rsi?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">MACD</span>
                  <span className="font-semibold text-white">{analysis?.indicators.macd?.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">MACD Histogram</span>
                  <span className={`font-semibold ${analysis?.indicators.macd_histogram >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analysis?.indicators.macd_histogram?.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">SMA 20</span>
                  <span className="font-semibold text-white">${analysis?.indicators.sma_20?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">SMA 50</span>
                  <span className="font-semibold text-white">${analysis?.indicators.sma_50?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">Beta vs SPY</span>
                  <span className="font-semibold text-white">{analysis?.indicators.beta?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-gray-400">Annual Volatility</span>
                  <span className={`font-semibold ${analysis?.indicators.volatility > 40 ? 'text-red-400' : 'text-white'}`}>
                    {analysis?.indicators.volatility?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio</span>
                  <span className={`font-semibold ${analysis?.indicators.sharpe_ratio > 1 ? 'text-emerald-400' : analysis?.indicators.sharpe_ratio < 0 ? 'text-red-400' : 'text-white'}`}>
                    {analysis?.indicators.sharpe_ratio?.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicator Charts Section (RSI & MACD line charts) */}
      {!loadingHistory && !loadingAnalysis && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <IndicatorCharts historyData={history} indicators={analysis.indicators} />
        </motion.div>
      )}

      {/* Company Description */}
      {!loadingDetails && details?.description && (
        <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">About Company</h2>
          <p className="text-gray-400 text-xs leading-relaxed font-normal">{details.description}</p>
        </div>
      )}
    </div>
  )
}
