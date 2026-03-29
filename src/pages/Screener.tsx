import { useState } from 'react'
import toast from 'react-hot-toast'
import { Filter, Zap } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { pnlColor } from '../utils/format'

const PLACEHOLDER_ROWS = [
  { ticker: 'SPY', price: 518.42, changePct: 0.64, rsi: 56.2, volume: '82.4M', sector: 'ETF' },
  { ticker: 'QQQ', price: 443.87, changePct: 1.12, rsi: 62.8, volume: '38.1M', sector: 'ETF' },
  { ticker: 'AAPL', price: 213.49, changePct: -0.38, rsi: 44.7, volume: '51.3M', sector: 'Tech' },
  { ticker: 'TSLA', price: 176.22, changePct: 2.85, rsi: 67.3, volume: '96.7M', sector: 'EV' },
  { ticker: 'NVDA', price: 875.35, changePct: 1.94, rsi: 71.2, volume: '44.8M', sector: 'Semi' },
]

const PRESETS = [
  { label: 'Momentum Movers', icon: '🚀', desc: 'RSI 60–80, above EMA20, strong volume' },
  { label: 'Oversold Bounces', icon: '📉', desc: 'RSI < 35, near support, high relative volume' },
  { label: 'Breakout Watch', icon: '📈', desc: 'Price near 52-week high, consolidating' },
]

export default function Screener() {
  const [rsiMin, setRsiMin] = useState(0)
  const [rsiMax, setRsiMax] = useState(100)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [volMin, setVolMin] = useState('')

  function handlePreset(name: string) {
    toast('Screener coming in next update — data fetching for 500 tickers requires rate limiting', {
      icon: '⚙️',
      style: { background: '#12121a', border: '1px solid #1e1e2e', color: '#f1f5f9', fontSize: 13 },
      duration: 4000,
    })
  }

  const filtered = PLACEHOLDER_ROWS.filter(r => {
    if (r.rsi < rsiMin || r.rsi > rsiMax) return false
    if (priceMin && r.price < parseFloat(priceMin)) return false
    if (priceMax && r.price > parseFloat(priceMax)) return false
    return true
  })

  const inputStyle = {
    background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '7px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', width: '100%',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Stock Screener</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Filter S&P 500 by key criteria</div>
      </div>

      {/* Preset Buttons */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Quick Presets" subtitle="One-click screener strategies" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.label)}
              style={{
                background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 8,
                padding: '16px', cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e2e')}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Manual Filters */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Manual Filters" action={<Filter size={14} color="#64748b" />} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>
              RSI Range: {rsiMin} – {rsiMax}
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="range" min={0} max={100} value={rsiMin}
                onChange={e => setRsiMin(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
              <input
                type="range" min={0} max={100} value={rsiMax}
                onChange={e => setRsiMax(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>Price Range ($)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>Min Volume</label>
            <input type="text" placeholder="e.g. 1000000" value={volMin} onChange={e => setVolMin(e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Volume filter is applied in full version</div>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader
          title="Screener Results"
          subtitle={`${filtered.length} results (sample data)`}
          action={<Badge variant="amber" size="xs"><Zap size={9} style={{ marginRight: 3 }} />Sample Data</Badge>}
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                {['Ticker', 'Sector', 'Price', 'Change %', 'RSI', 'Volume'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Ticker' || h === 'Sector' ? 'left' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ticker} style={{ borderBottom: '1px solid #1e1e2e' }}>
                  <td style={{ padding: '10px 10px', color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{r.ticker}</td>
                  <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{r.sector}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>${r.price.toFixed(2)}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: pnlColor(r.changePct), fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: r.rsi > 70 ? '#ef4444' : r.rsi < 30 ? '#22c55e' : '#f1f5f9' }}>
                    {r.rsi.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{r.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Note */}
      <div style={{
        background: '#f59e0b10', border: '1px solid #f59e0b20', borderRadius: 8,
        padding: '12px 16px', fontSize: 12, color: '#f59e0b',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Zap size={14} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong>Full screener requires batch data fetching</strong> — add tickers to your watchlist and analyze individually for now.
          The preset buttons will activate in a future update with rate-limited batch fetching.
        </div>
      </div>
    </div>
  )
}
