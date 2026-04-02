import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { fetchFearAndGreed } from '../api/market'

const COINS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', abbr: 'BTC', icon: '₿', color: '#f59e0b', desc: 'Store of value, digital gold' },
  { symbol: 'ETH-USD', name: 'Ethereum', abbr: 'ETH', icon: 'Ξ', color: '#8b5cf6', desc: 'Smart contracts, DeFi backbone' },
  { symbol: 'SOL-USD', name: 'Solana', abbr: 'SOL', icon: '◎', color: '#22c55e', desc: 'High-speed L1 blockchain' },
  { symbol: 'XRP-USD', name: 'XRP', abbr: 'XRP', icon: '✕', color: '#3b82f6', desc: 'Cross-border payments protocol' },
]

function fngLabel(v: number): { label: string; color: string } {
  if (v <= 24) return { label: 'Extreme Fear', color: '#ef4444' }
  if (v <= 44) return { label: 'Fear', color: '#f97316' }
  if (v <= 55) return { label: 'Neutral', color: '#64748b' }
  if (v <= 75) return { label: 'Greed', color: '#22c55e' }
  return { label: 'Extreme Greed', color: '#16a34a' }
}

export default function Crypto() {
  const navigate = useNavigate()

  const { data: fng, isLoading: fngLoading } = useQuery({
    queryKey: ['fng'],
    queryFn: fetchFearAndGreed,
    staleTime: 300_000,
  })

  const fngInfo = fng ? fngLabel(fng.value) : null

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Crypto Module</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          Crypto analysis powered by the JARVIS Trade Analyzer engine
        </div>
      </div>

      {/* Note Banner */}
      <div style={{
        background: '#3b82f610', border: '1px solid #3b82f620', borderRadius: 8,
        padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#64748b', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#3b82f6' }}>Crypto analysis uses the same Trade Analyzer engine.</strong>{' '}
        Click any coin below or type any Yahoo Finance crypto ticker in the Analyzer (e.g. BTC-USD, ETH-USD, SOL-USD, XRP-USD, DOGE-USD).
        Data is sourced from Yahoo Finance via the proxy server.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start', marginBottom: 20 }}>
        {/* Coin Grid */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Top Coins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {COINS.map(coin => (
              <Card
                key={coin.symbol}
                hover
                padding={20}
                style={{ cursor: 'pointer', border: `1px solid ${coin.color}20` }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${coin.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: coin.color,
                  }}>
                    {coin.icon}
                  </div>
                  <button
                    onClick={() => navigate(`/analyze/${coin.symbol}`)}
                    style={{
                      background: `${coin.color}18`, border: `1px solid ${coin.color}30`,
                      borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                      color: coin.color, fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    Analyze <ExternalLink size={10} />
                  </button>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{coin.name}</div>
                <div style={{ fontSize: 12, color: coin.color, fontWeight: 600, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                  {coin.abbr}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{coin.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Fear & Greed */}
          <Card>
            <CardHeader title="Crypto Fear & Greed" subtitle="Alternative.me sentiment index" />
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
                    background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)',
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

          {/* Concepts */}
          <Card>
            <CardHeader title="Key Concepts" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  term: 'Market Cap',
                  def: 'Price × circulating supply. BTC dominance shows its share of total crypto market cap.',
                },
                {
                  term: 'BTC Dominance',
                  def: 'When dominance rises, capital flows to BTC. When it falls, altcoin season often follows.',
                },
                {
                  term: 'Fear & Greed Index',
                  def: 'Combines volatility, momentum, social media, and dominance. Extreme fear = potential buy zone.',
                },
                {
                  term: 'On-chain Volume',
                  def: 'High volume on breakouts confirms institutional interest. Low volume = weak move.',
                },
              ].map(({ term, def }) => (
                <div key={term} style={{ paddingBottom: 10, borderBottom: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{term}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{def}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Your Holdings Note */}
      <Card style={{ background: '#f59e0b08', border: '1px solid #f59e0b18' }}>
        <CardHeader title="Your Crypto Positions" subtitle="From portfolio settings" />
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
          Track your crypto holdings in the <strong style={{ color: '#f1f5f9' }}>Portfolio</strong> tab by setting asset type to "crypto".
          Prices are fetched live from Yahoo Finance. For XRP and GRT specifically, use tickers{' '}
          <code style={{ background: '#1a1a2e', padding: '1px 5px', borderRadius: 3, color: '#f59e0b', fontSize: 11 }}>XRP-USD</code> and{' '}
          <code style={{ background: '#1a1a2e', padding: '1px 5px', borderRadius: 3, color: '#f59e0b', fontSize: 11 }}>GRT-USD</code> in the Analyzer.
        </div>
      </Card>
    </div>
  )
}
