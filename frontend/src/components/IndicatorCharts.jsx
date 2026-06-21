import {
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e2d] border border-white/[0.1] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function RSIChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">RSI (Relative Strength Index)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="#4a4a5a"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#4a4a5a"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '70', fill: '#ef4444', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30', fill: '#10b981', fontSize: 10, position: 'right' }} />
          <Line
            type="monotone"
            dataKey="rsi"
            name="RSI"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function MACDChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">MACD (Moving Average Convergence Divergence)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="#4a4a5a"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            stroke="#4a4a5a"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar
            dataKey="histogram"
            name="Histogram"
            fill="#6366f1"
            opacity={0.6}
            barSize={3}
          />
          <Line type="monotone" dataKey="macd" name="MACD" stroke="#6366f1" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="signal" name="Signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function IndicatorCharts({ historyData, indicators }) {
  // Build RSI data from historyData if available
  const rsiData = historyData?.map((d) => ({
    date: d.date,
    rsi: d.rsi,
  })).filter((d) => d.rsi != null) || []

  // Build MACD data from historyData if available
  const macdData = historyData?.map((d) => ({
    date: d.date,
    macd: d.macd,
    signal: d.macd_signal,
    histogram: d.macd_histogram,
  })).filter((d) => d.macd != null) || []

  if (rsiData.length === 0 && macdData.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {rsiData.length > 0 && <RSIChart data={rsiData} />}
      {macdData.length > 0 && <MACDChart data={macdData} />}
    </div>
  )
}
