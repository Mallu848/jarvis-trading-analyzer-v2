import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { fetchOptionsChain } from '../api/yahoo'
import { blackScholes } from '../lib/blackScholes'
import { fmt } from '../utils/format'
import type { StrategyType } from '../types/options'

const STRATEGIES: { type: StrategyType; name: string; conditions: string; maxGain: string; maxLoss: string; when: string; sp: number; strike: number; dte: number; iv: number }[] = [
  { type: 'long-call', name: 'Long Call', conditions: 'Bullish, trending up', maxGain: 'Unlimited', maxLoss: 'Premium paid', when: 'Strong uptrend, breakout above resistance', sp: 100, strike: 105, dte: 45, iv: 30 },
  { type: 'long-put', name: 'Long Put', conditions: 'Bearish, trending down', maxGain: 'Strike − Premium', maxLoss: 'Premium paid', when: 'Downtrend, break below support', sp: 100, strike: 95, dte: 45, iv: 30 },
  { type: 'bull-call-spread', name: 'Bull Call Spread', conditions: 'Moderately bullish', maxGain: 'Spread width − debit', maxLoss: 'Debit paid', when: 'Bullish but want to cap cost', sp: 100, strike: 100, dte: 30, iv: 25 },
  { type: 'bear-put-spread', name: 'Bear Put Spread', conditions: 'Moderately bearish', maxGain: 'Spread width − debit', maxLoss: 'Debit paid', when: 'Bearish, limited downside expected', sp: 100, strike: 100, dte: 30, iv: 25 },
  { type: 'iron-condor', name: 'Iron Condor', conditions: 'Neutral, low volatility expected', maxGain: 'Net credit received', maxLoss: 'Spread width − credit', when: 'Range-bound market, high IV rank', sp: 100, strike: 105, dte: 45, iv: 35 },
]

function buildPnlData(sp: number, strike: number, optType: 'call' | 'put', premium: number) {
  const low = sp * 0.7
  const high = sp * 1.3
  const steps = 40
  return Array.from({ length: steps + 1 }).map((_, i) => {
    const price = low + (i / steps) * (high - low)
    const payoff = optType === 'call'
      ? Math.max(price - strike, 0) - premium
      : Math.max(strike - price, 0) - premium
    return { price: parseFloat(price.toFixed(2)), pnl: parseFloat((payoff * 100).toFixed(2)) }
  })
}

export default function OptionsAnalyzer() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [loadChain, setLoadChain] = useState(false)

  const [sp, setSp] = useState(100)
  const [strike, setStrike] = useState(105)
  const [dte, setDte] = useState(45)
  const [iv, setIv] = useState(30)
  const [rfr, setRfr] = useState(4.5)
  const [optType, setOptType] = useState<'call' | 'put'>('call')

  const bsResult = blackScholes({
    stockPrice: sp, strikePrice: strike, daysToExpiration: dte,
    impliedVolatility: iv / 100, riskFreeRate: rfr / 100, optionType: optType,
  })

  const pnlData = buildPnlData(sp, strike, optType, bsResult.price)

  const { data: chain, isLoading: chainLoading } = useQuery({
    queryKey: ['options', ticker],
    queryFn: () => fetchOptionsChain(ticker!),
    enabled: !!ticker && loadChain,
  })

  function applyStrategy(s: typeof STRATEGIES[0]) {
    setSp(s.sp); setStrike(s.strike); setDte(s.dte); setIv(s.iv)
    setOptType(s.type.includes('put') || s.type.includes('bear') ? 'put' : 'call')
  }

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '8px 10px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Options Analyzer</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Black-Scholes calculator + live options chain</div>
      </div>

      {/* Ticker Search */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && searchInput.trim() && navigate(`/options/${searchInput.trim()}`)}
            placeholder={ticker ? `Loaded: ${ticker} — switch ticker…` : 'Enter ticker to load options chain…'}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => searchInput.trim() && navigate(`/options/${searchInput.trim()}`)}
            style={{
              background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 16px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Search size={14} /> Load
          </button>
        </div>
      </Card>

      {/* Black-Scholes Calculator */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Black-Scholes Calculator" subtitle="Real-time options pricing" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Stock Price ($)</label>
            <input type="number" value={sp} onChange={e => setSp(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Strike Price ($)</label>
            <input type="number" value={strike} onChange={e => setStrike(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Days to Expiry</label>
            <input type="number" value={dte} onChange={e => setDte(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Type</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              {(['call', 'put'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOptType(t)}
                  style={{
                    padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: optType === t ? (t === 'call' ? '#22c55e' : '#ef4444') : '#1a1a2e',
                    color: optType === t ? '#fff' : '#64748b',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>IV %</label>
            <input type="number" value={iv} step={0.5} onChange={e => setIv(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Risk-Free Rate %</label>
            <input type="number" value={rfr} step={0.1} onChange={e => setRfr(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Theoretical Price', value: `$${bsResult.price.toFixed(3)}`, color: '#3b82f6' },
            { label: 'Delta', value: bsResult.delta.toFixed(4), color: bsResult.delta > 0 ? '#22c55e' : '#ef4444' },
            { label: 'Gamma', value: bsResult.gamma.toFixed(5), color: '#f1f5f9' },
            { label: 'Theta/day', value: `$${bsResult.theta.toFixed(4)}`, color: '#ef4444' },
            { label: 'Vega', value: bsResult.vega.toFixed(4), color: '#f1f5f9' },
            { label: 'Breakeven', value: fmt.price(bsResult.breakeven), color: '#f59e0b' },
            { label: 'Prob of Profit', value: `${(bsResult.probabilityOfProfit * 100).toFixed(1)}%`, color: bsResult.probabilityOfProfit > 0.5 ? '#22c55e' : '#ef4444' },
            { label: 'Intrinsic Value', value: `$${bsResult.intrinsicValue.toFixed(3)}`, color: '#f1f5f9' },
            { label: 'Extrinsic Value', value: `$${bsResult.extrinsicValue.toFixed(3)}`, color: '#f1f5f9' },
            { label: 'Contract Value', value: `$${(bsResult.price * 100).toFixed(2)}`, color: '#3b82f6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#1a1a2e', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* P&L Diagram */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em' }}>
            P&L AT EXPIRATION (per contract)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={pnlData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="price" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                labelFormatter={l => `Stock @ $${l}`}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
              <ReferenceLine x={sp} stroke="#3b82f6" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="pnl"
                stroke={optType === 'call' ? '#22c55e' : '#ef4444'}
                dot={false} strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Strategy Templates */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Strategy Templates" subtitle="Click to load into calculator" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {STRATEGIES.map(s => (
            <div
              key={s.type}
              onClick={() => applyStrategy(s)}
              style={{
                background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 8, padding: 14,
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e2e')}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{s.conditions}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge variant="green" size="xs">Max: {s.maxGain}</Badge>
                <Badge variant="red" size="xs">Risk: {s.maxLoss}</Badge>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{s.when}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Options Chain */}
      {ticker && (
        <Card>
          <CardHeader
            title={`Options Chain — ${ticker}`}
            action={
              !loadChain ? (
                <button
                  onClick={() => setLoadChain(true)}
                  style={{
                    background: '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 14px',
                    cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600,
                  }}
                >
                  Load Chain
                </button>
              ) : null
            }
          />
          {!loadChain && (
            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Click "Load Chain" to fetch live options data.
            </div>
          )}
          {loadChain && chainLoading && <SkeletonCard rows={6} />}
          {loadChain && chain && (
            <div>
              {(['calls', 'puts'] as const).map(side => {
                const contracts = chain[side] ?? []
                return (
                  <div key={side} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: side === 'calls' ? '#22c55e' : '#ef4444', marginBottom: 8, letterSpacing: '0.06em' }}>
                      {side.toUpperCase()}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                            {['Strike','Bid','Ask','Mid','Vol','OI','IV%','Delta'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.slice(0, 20).map((c: any, i: number) => (
                            <tr
                              key={i}
                              style={{
                                borderBottom: '1px solid #1e1e2e',
                                background: c.inTheMoney ? '#22c55e08' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: c.inTheMoney ? '#22c55e' : '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmt.price(c.strike)}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{c.bid.toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{c.ask.toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#3b82f6', fontFamily: 'JetBrains Mono, monospace' }}>{c.mid.toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.volume(c.volume)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.volume(c.openInterest)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>{(c.iv * 100).toFixed(1)}%</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: c.delta && c.delta > 0 ? '#22c55e' : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                                {c.delta != null ? c.delta.toFixed(3) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
