import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, AlertTriangle, Search } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useWatchlistStore, useSettingsStore, useRecentStore } from '../store/index'
import { fetchStockAnalysis } from '../api/yahoo'
import { positionSizer } from '../lib/blackScholes'
import { fmt, pnlColor } from '../utils/format'
import { sanitizeTicker, clampNumber } from '../utils/sanitize'

function verdictVariant(v: string): 'green' | 'red' | 'amber' | 'blue' | 'muted' {
  const low = v.toLowerCase()
  if (low.includes('bull') || low.includes('buy') || low.includes('strong')) return 'green'
  if (low.includes('bear') || low.includes('sell') || low.includes('avoid')) return 'red'
  if (low.includes('wait') || low.includes('caution') || low.includes('neutral')) return 'amber'
  return 'blue'
}

function qualityStars(q: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <span key={i} style={{ color: i < q ? '#f59e0b' : '#1e1e2e', fontSize: 16 }}>★</span>
  ))
}

function ftfcColor(f: string) {
  if (f === 'GREEN') return '#22c55e'
  if (f === 'RED') return '#ef4444'
  return '#f59e0b'
}

function trendColor(t: string) {
  if (t.includes('uptrend') || t === 'recovery') return '#22c55e'
  if (t === 'downtrend') return '#ef4444'
  if (t === 'pullback') return '#f59e0b'
  return '#64748b'
}

function plainCallout(
  verdict: string,
  entryConservative: number,
  target1: number,
  stopNormal: number,
): { emoji: string; headline: string; text: string; color: string; bg: string } {
  const v = verdict.toLowerCase()
  if (v.includes('bull') || v.includes('buy') || v.includes('strong')) {
    return {
      emoji: '📈',
      headline: 'Looks like a Buy',
      text: `The indicators are bullish. A safe entry is around ${fmt.price(entryConservative)}. First target is ${fmt.price(target1)}. If the trade goes against you, cut your loss around ${fmt.price(stopNormal)}.`,
      color: '#22c55e',
      bg: '#22c55e10',
    }
  }
  if (v.includes('bear') || v.includes('sell') || v.includes('avoid')) {
    return {
      emoji: '📉',
      headline: 'Avoid or Sell',
      text: `The stock is showing weakness. This is not a great time to buy. If you're already holding, consider your exit. Bears are in control right now.`,
      color: '#ef4444',
      bg: '#ef444410',
    }
  }
  return {
    emoji: '⏸',
    headline: 'Wait for a Clearer Setup',
    text: `Signals are mixed — no strong direction yet. It's best to wait before entering. A clear breakout or breakdown will give a better entry.`,
    color: '#f59e0b',
    bg: '#f59e0b10',
  }
}

export default function TradeAnalyzer() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const watchlist = useWatchlistStore()
  const settings = useSettingsStore()
  const recent = useRecentStore()

  const [searchInput, setSearchInput] = useState('')
  const [accountSizeStr, setAccountSizeStr] = useState(String(settings.accountSize))
  const [riskPctStr, setRiskPctStr] = useState(String(settings.riskPct))

  const accountSize = parseFloat(accountSizeStr) || 0
  const riskPct = parseFloat(riskPctStr) || 0.1

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analysis', ticker],
    queryFn: () => fetchStockAnalysis(ticker!),
    enabled: !!ticker,
    staleTime: 120_000,
  })

  useEffect(() => {
    if (data) {
      recent.push({
        ticker: data.ticker,
        timestamp: Date.now(),
        verdict: data.tradeSetup.verdict,
      })
    }
  }, [data?.ticker])

  if (!ticker) {
    return (
      <div style={{ padding: '24px 24px 40px' }}>
        <div style={{ paddingBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Trade Analyzer</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Enter a ticker to get a full trade setup analysis</div>
        </div>
        <Card style={{ maxWidth: 480 }}>
          <CardHeader title="Search Ticker" />
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(sanitizeTicker(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && searchInput.trim() && navigate(`/analyze/${searchInput.trim()}`)}
              placeholder="e.g. TSLA, AAPL, BTC-USD"
              autoFocus
              style={{
                flex: 1, background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
                padding: '9px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none',
              }}
            />
            <button
              onClick={() => searchInput.trim() && navigate(`/analyze/${searchInput.trim()}`)}
              style={{
                background: '#3b82f6', border: 'none', borderRadius: 6, padding: '9px 16px',
                cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Search size={14} /> Analyze
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const isWatched = watchlist.has(ticker)
  const setup = data?.tradeSetup
  const tech = data?.technicals
  const quote = data?.quote

  const lastEma5 = tech?.ema5.filter(Boolean).at(-1) ?? null
  const lastEma9 = tech?.ema9.filter(Boolean).at(-1) ?? null
  const lastEma21 = tech?.ema21.filter(Boolean).at(-1) ?? null
  const lastRsi = tech?.rsi.filter(Boolean).at(-1) ?? null
  const lastMacd = tech?.macd.filter(v => v.histogram != null).at(-1)?.histogram ?? null
  const lastAtr = tech?.atr.filter(Boolean).at(-1) ?? null

  const sizing = setup
    ? positionSizer(accountSize, riskPct, setup.entryConservative, setup.stopNormal)
    : null

  const daysToEarnings = data?.earningsDate
    ? Math.round((data.earningsDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const earningsWarning = daysToEarnings !== null && daysToEarnings >= 0 && daysToEarnings <= 21

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      {/* Header */}
      <div style={{ paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{ticker}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={searchInput}
                onChange={e => setSearchInput(sanitizeTicker(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && searchInput.trim() && navigate(`/analyze/${searchInput.trim()}`)}
                placeholder="Switch ticker…"
                style={{
                  background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
                  padding: '5px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', width: 150,
                }}
              />
              <button
                onClick={() => searchInput.trim() && navigate(`/analyze/${searchInput.trim()}`)}
                style={{
                  background: '#3b82f618', border: '1px solid #3b82f630', borderRadius: 6,
                  padding: '5px 10px', cursor: 'pointer', color: '#3b82f6', fontSize: 12,
                }}
              >
                Go
              </button>
            </div>
          </div>
          {quote && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{quote.name}</div>}
        </div>
        <button
          onClick={() => isWatched ? watchlist.remove(ticker) : watchlist.add(ticker)}
          style={{
            background: isWatched ? '#f59e0b18' : '#1a1a2e', border: `1px solid ${isWatched ? '#f59e0b30' : '#1e1e2e'}`,
            borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
            color: isWatched ? '#f59e0b' : '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Star size={14} fill={isWatched ? '#f59e0b' : 'none'} />
          {isWatched ? 'Watching' : 'Watch'}
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} rows={5} />)}
        </div>
      )}

      {isError && (
        <Card style={{ border: '1px solid #ef444430' }}>
          <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>Failed to load analysis</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{String(error)}</div>
        </Card>
      )}

      {data && setup && tech && quote && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Earnings Warning */}
          {earningsWarning && (
            <div style={{
              background: '#f59e0b18', border: '1px solid #f59e0b30', borderRadius: 8,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
                Earnings in {daysToEarnings} day{daysToEarnings === 1 ? '' : 's'} — elevated IV risk. Size down or avoid.
              </span>
            </div>
          )}

          {/* Plain English Callout */}
          {(() => {
            const c = plainCallout(setup.verdict, setup.entryConservative, setup.target1, setup.stopNormal)
            return (
              <div style={{
                background: c.bg, border: `1px solid ${c.color}40`, borderRadius: 10,
                padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginBottom: 6 }}>{c.headline}</div>
                  <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.65 }}>{c.text}</div>
                </div>
              </div>
            )
          })()}

          {/* Quote Header */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                {fmt.price(quote.price)}
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, color: pnlColor(quote.change) }}>
                {fmt.pnl(quote.change)} ({fmt.pct(quote.changePct)})
              </span>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Volume</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmt.volume(quote.volume)}
                </div>
              </div>
            </div>
          </Card>

          {/* Trade Setup — most prominent */}
          <Card padding={20} style={{ border: '1px solid #3b82f630' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Trade Setup
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge variant={verdictVariant(setup.verdict)}>{setup.verdict}</Badge>
                  <span style={{ color: trendColor(setup.trend), fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                    {setup.trend.replace(/-/g, ' ')}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Setup Quality</div>
                <div style={{ display: 'flex', gap: 2 }}>{qualityStars(setup.setupQuality)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {/* Entry Zones */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 6, letterSpacing: '0.05em' }}>ENTRY ZONES</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'Aggressive', val: setup.entryAggressive },
                      { label: 'Conservative', val: setup.entryConservative },
                      { label: 'Strong Move', val: setup.entryStrong },
                    ].map(({ label, val }) => (
                      <tr key={label}>
                        <td style={{ fontSize: 11, color: '#64748b', paddingBottom: 4 }}>{label}</td>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmt.price(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Stop Loss */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6, letterSpacing: '0.05em' }}>STOP LOSS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'Tight', val: setup.stopTight },
                      { label: 'Normal', val: setup.stopNormal },
                      { label: 'Wide', val: setup.stopWide },
                    ].map(({ label, val }) => (
                      <tr key={label}>
                        <td style={{ fontSize: 11, color: '#64748b', paddingBottom: 4 }}>{label}</td>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmt.price(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Targets */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 6, letterSpacing: '0.05em' }}>PRICE TARGETS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'Target 1', val: setup.target1 },
                      { label: 'Target 2', val: setup.target2 },
                      { label: 'Target 3', val: setup.target3 },
                    ].map(({ label, val }) => (
                      <tr key={label}>
                        <td style={{ fontSize: 11, color: '#64748b', paddingBottom: 4 }}>{label}</td>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmt.price(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {setup.rsiValue && (
                <div style={{ background: '#1a1a2e', borderRadius: 6, padding: '4px 10px' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>RSI </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: setup.rsiValue < 30 ? '#22c55e' : setup.rsiValue > 70 ? '#ef4444' : '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                    {setup.rsiValue.toFixed(1)}
                  </span>
                </div>
              )}
              {setup.atrValue && (
                <div style={{ background: '#1a1a2e', borderRadius: 6, padding: '4px 10px' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>ATR </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                    {fmt.price(setup.atrValue)}
                  </span>
                </div>
              )}
              <div style={{ background: '#1a1a2e', borderRadius: 6, padding: '4px 10px' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>R:R T1 </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                  1:{setup.riskRewardT1.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid #1e1e2e' }}>
              <div><span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>BULLS NEED: </span><span style={{ fontSize: 12, color: '#f1f5f9' }}>{setup.bullsNeed}</span></div>
              <div><span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>BEARS WIN: </span><span style={{ fontSize: 12, color: '#f1f5f9' }}>{setup.bearsWin}</span></div>
              <div><span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>BEST SETUP: </span><span style={{ fontSize: 12, color: '#f1f5f9' }}>{setup.bestSetup}</span></div>
            </div>
          </Card>

          {/* Position Sizer */}
          <Card>
            <CardHeader title="Position Sizer" subtitle="Based on account risk" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Account Size ($)</label>
                <input
                  type="number"
                  value={accountSizeStr}
                  onChange={e => setAccountSizeStr(e.target.value)}
                  style={{
                    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
                    padding: '8px 10px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Risk % per Trade</label>
                <input
                  type="number"
                  value={riskPctStr}
                  step={0.5}
                  onChange={e => setRiskPctStr(e.target.value)}
                  style={{
                    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
                    padding: '8px 10px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            {sizing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Max Risk', value: fmt.currency(sizing.maxRisk), color: '#ef4444' },
                  { label: 'Shares', value: sizing.shares.toString(), color: '#f1f5f9' },
                  { label: 'Total Cost', value: fmt.currency(sizing.totalCost), color: '#f1f5f9' },
                  { label: 'If Wrong, Lose', value: fmt.currency(sizing.maxRisk), color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#1a1a2e', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Technicals Grid */}
          <Card>
            <CardHeader title="Technical Indicators" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'EMA 5', value: lastEma5 ? fmt.price(lastEma5) : '—', color: '#f1f5f9' },
                { label: 'EMA 9', value: lastEma9 ? fmt.price(lastEma9) : '—', color: '#f1f5f9' },
                { label: 'EMA 21', value: lastEma21 ? fmt.price(lastEma21) : '—', color: '#f1f5f9' },
                { label: 'RSI', value: lastRsi ? lastRsi.toFixed(1) : '—', color: lastRsi ? (lastRsi < 30 ? '#22c55e' : lastRsi > 70 ? '#ef4444' : '#f1f5f9') : '#64748b' },
                { label: 'MACD Hist', value: lastMacd !== null ? lastMacd.toFixed(3) : '—', color: lastMacd !== null ? pnlColor(lastMacd) : '#64748b' },
                { label: 'ATR', value: lastAtr ? fmt.price(lastAtr) : '—', color: '#f1f5f9' },
                { label: 'Vol Ratio', value: `${(tech.volumeRatio * 100).toFixed(0)}%`, color: tech.volumeRatio > 1.5 ? '#22c55e' : tech.volumeRatio < 0.7 ? '#64748b' : '#f1f5f9' },
                { label: 'FTFC', value: tech.ftfc, color: ftfcColor(tech.ftfc) },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#1a1a2e', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Levels */}
          <Card>
            <CardHeader title="Key Levels" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Weekly High', value: tech.weeklyHigh, color: '#22c55e' },
                  { label: 'Weekly Low', value: tech.weeklyLow, color: '#ef4444' },
                  { label: 'Monthly Open', value: tech.monthlyOpen, color: '#f59e0b' },
                  { label: 'Nearest Resistance', value: tech.resistanceLevels[0] ?? null, color: '#ef4444' },
                  { label: 'Nearest Support', value: tech.supportLevels[0] ?? null, color: '#22c55e' },
                ].map(({ label, value, color }) => (
                  <tr key={label} style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <td style={{ padding: '8px 4px', fontSize: 12, color: '#64748b' }}>{label}</td>
                    <td style={{ padding: '8px 4px', fontSize: 13, fontWeight: 700, color, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                      {value ? fmt.price(value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}
