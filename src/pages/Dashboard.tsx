import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Star, X, Plus, TrendingUp } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useWatchlistStore, useRecentStore } from '../store/index'
import { fetchMarketOverview, fetchFearAndGreed } from '../api/market'
import { fmt, pnlColor } from '../utils/format'
import { sanitizeTicker } from '../utils/sanitize'
import type { MarketOverviewItem } from '../types/market'

function fngLabel(v: number): { label: string; color: string } {
  if (v <= 24) return { label: 'Extreme Fear', color: '#ef4444' }
  if (v <= 44) return { label: 'Fear', color: '#f97316' }
  if (v <= 55) return { label: 'Neutral', color: '#64748b' }
  if (v <= 75) return { label: 'Greed', color: '#22c55e' }
  return { label: 'Extreme Greed', color: '#16a34a' }
}

function verdictVariant(verdict: string): 'green' | 'red' | 'amber' | 'blue' | 'muted' {
  const v = verdict.toLowerCase()
  if (v.includes('bull') || v.includes('buy') || v.includes('strong up')) return 'green'
  if (v.includes('bear') || v.includes('sell') || v.includes('avoid')) return 'red'
  if (v.includes('caution') || v.includes('wait') || v.includes('neutral')) return 'amber'
  return 'blue'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const watchlist = useWatchlistStore()
  const recentStore = useRecentStore()
  const [now, setNow] = useState(new Date())
  const [addInput, setAddInput] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: fetchMarketOverview,
    staleTime: 60_000,
  })

  const { data: fng, isLoading: fngLoading } = useQuery({
    queryKey: ['fng'],
    queryFn: fetchFearAndGreed,
    staleTime: 300_000,
  })

  function handleAddTicker() {
    const t = addInput.trim().toUpperCase()
    if (t) {
      watchlist.add(t)
      setAddInput('')
    }
  }

  const fngInfo = fng ? fngLabel(fng.value) : null

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      {/* Page Header */}
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Dashboard</h1>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          {format(now, 'EEEE, MMMM d yyyy · h:mm a')}
        </div>
      </div>

      {/* Market Overview Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Market Overview
        </div>
        {marketLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {(Array.isArray(marketData) ? marketData : []).map((item: MarketOverviewItem) => (
              <Card key={item.symbol} padding={14}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>{item.label || item.symbol}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmt.price(item.price)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: pnlColor(item.changePct), marginTop: 2 }}>
                  {fmt.pct(item.changePct)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Watchlist */}
          <Card>
            <CardHeader
              title="Watchlist"
              subtitle={`${watchlist.tickers.length} tickers`}
              action={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={addInput}
                    onChange={e => setAddInput(sanitizeTicker(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleAddTicker()}
                    placeholder="Add ticker…"
                    style={{
                      background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
                      padding: '5px 10px', fontSize: 12, color: '#f1f5f9', width: 110,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddTicker}
                    style={{
                      background: '#3b82f6', border: 'none', borderRadius: 6,
                      padding: '5px 10px', cursor: 'pointer', color: '#fff', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              }
            />
            {watchlist.tickers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
                <Star size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>Your watchlist is empty.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Add a ticker above to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {watchlist.tickers.map(ticker => (
                  <div key={ticker} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 6, background: '#1a1a2e',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                      {ticker}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/analyze/${ticker}`)}
                        style={{
                          background: '#3b82f618', border: '1px solid #3b82f630', borderRadius: 5,
                          padding: '4px 10px', fontSize: 11, color: '#3b82f6', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        Analyze →
                      </button>
                      <button
                        onClick={() => watchlist.remove(ticker)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Analyses */}
          <Card>
            <CardHeader title="Recent Analyses" subtitle="Last 10 tickers analyzed" />
            {recentStore.recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 13 }}>
                <TrendingUp size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No analyses yet. Search for a ticker to start.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentStore.recent.map(item => (
                  <div
                    key={item.ticker}
                    onClick={() => navigate(`/analyze/${item.ticker}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 6, background: '#1a1a2e', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', minWidth: 56 }}>
                        {item.ticker}
                      </span>
                      <Badge variant={verdictVariant(item.verdict)} size="xs">{item.verdict}</Badge>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Fear & Greed */}
          <Card>
            <CardHeader title="Fear & Greed Index" subtitle="CNN Market Sentiment" />
            {fngLoading ? (
              <SkeletonCard rows={2} />
            ) : fng && fngInfo ? (
              <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                <div style={{
                  fontSize: 56, fontWeight: 800, color: fngInfo.color,
                  fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
                }}>
                  {fng.value}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: fngInfo.color, marginTop: 8 }}>
                  {fngInfo.label}
                </div>
                <div style={{ marginTop: 12, background: '#1a1a2e', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${fng.value}%`, height: '100%',
                    background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#64748b' }}>
                  <span>Fear</span><span>Neutral</span><span>Greed</span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 16 }}>Unavailable</div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Analyze a Stock', path: '/analyze', color: '#3b82f6' },
                { label: 'Options Calculator', path: '/options', color: '#8b5cf6' },
                { label: 'View Portfolio', path: '/portfolio', color: '#22c55e' },
                { label: 'Trade Journal', path: '/journal', color: '#f59e0b' },
              ].map(({ label, path, color }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 6,
                    padding: '9px 12px', cursor: 'pointer', color, fontSize: 12, fontWeight: 600,
                    textAlign: 'left', width: '100%',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
