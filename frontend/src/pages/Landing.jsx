import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { useEffect } from 'react'

const features = [
  {
    icon: '📡',
    title: 'Real-Time Data',
    desc: 'Live stock prices and market data from Yahoo Finance with instant updates.',
  },
  {
    icon: '📐',
    title: 'Technical Analysis',
    desc: 'RSI, MACD, SMA, Bollinger Bands, and more with automated signal detection.',
  },
  {
    icon: '🤖',
    title: 'AI Recommendations',
    desc: 'Intelligent BUY/HOLD/SELL signals based on multi-indicator consensus analysis.',
  },
  {
    icon: '🧠',
    title: 'LSTM Forecasting',
    desc: 'Deep learning price predictions using LSTM neural networks with confidence intervals.',
  },
]

const techBadges = ['React 19', 'FastAPI', 'Python', 'LSTM', 'Recharts', 'Tailwind CSS', 'MongoDB']

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#6366f1]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <span className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
            StockSense
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="border border-white/[0.1] text-gray-300 px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all text-sm"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium px-4 py-2 rounded-lg hover:brightness-110 hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all text-sm"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto text-center px-6 pt-16 md:pt-28 pb-20">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8] text-xs font-medium mb-6 tracking-wider uppercase">
            AI-Powered Analytics
          </span>
        </motion.div>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
        >
          <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            AI-Powered{' '}
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
            Stock Analysis
          </span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Advanced technical indicators, real-time market data, and LSTM deep learning forecasts — all in one beautiful platform.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold px-8 py-3.5 rounded-xl hover:brightness-110 hover:shadow-xl hover:shadow-[#6366f1]/30 transition-all duration-300 text-base"
          >
            Get Started Free →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border border-white/[0.15] text-gray-300 font-medium px-8 py-3.5 rounded-xl hover:bg-white/[0.05] hover:border-white/[0.25] transition-all duration-300 text-base"
          >
            Sign In
          </button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-300 group"
            >
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech badges */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 text-center">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-4 font-medium">Built With</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {techBadges.map((badge) => (
            <span
              key={badge}
              className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-400 text-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8 text-center text-gray-500 text-sm">
        <p>© 2026 StockSense. College Project — AI Stock Analysis & Forecasting Platform.</p>
      </footer>
    </div>
  )
}
