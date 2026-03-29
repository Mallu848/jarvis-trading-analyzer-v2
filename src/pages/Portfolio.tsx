import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Trash2, Upload } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { usePortfolioStore } from '../store/index'
import { fetchQuotes } from '../api/yahoo'
import { fmt, pnlColor } from '../utils/format'
import type { AssetType, RobinhoodCSVRow } from '../types/portfolio'

const ASSET_COLORS: Record<AssetType, string> = {
  stock: '#3b82f6', option: '#8b5cf6', crypto: '#f59e0b', etf: '#22c55e',
}
const ASSET_VARIANTS: Record<AssetType, 'blue' | 'muted' | 'amber' | 'green'> = {
  stock: 'blue', option: 'muted', crypto: 'amber', etf: 'green',
}

const EMPTY_FORM = {
  ticker: '', name: '', assetType: 'stock' as AssetType,
  shares: '', avgCost: '', dateAdded: new Date().toISOString().split('T')[0], notes: '',
}

function parseRobinhoodCSV(text: string): RobinhoodCSVRow[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row as RobinhoodCSVRow
  })
}

export default function Portfolio() {
  const store = usePortfolioStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const fileRef = useRef<HTMLInputElement>(null)

  const tickers = [...new Set(store.positions.map(p => p.ticker))]

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['portfolio-prices', tickers.join(',')],
    queryFn: () => fetchQuotes(tickers),
    enabled: tickers.length > 0,
    staleTime: 60_000,
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const shares = parseFloat(form.shares)
    const avgCost = parseFloat(form.avgCost)
    if (!form.ticker.trim() || isNaN(shares) || isNaN(avgCost)) {
      toast.error('Fill in ticker, shares, and avg cost')
      return
    }
    store.add({
      id: crypto.randomUUID(),
      ticker: form.ticker.trim().toUpperCase(),
      name: form.name || undefined,
      assetType: form.assetType,
      shares,
      avgCost,
      dateAdded: form.dateAdded,
      notes: form.notes || undefined,
    })
    setForm(EMPTY_FORM)
    toast.success('Position added')
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const rows = parseRobinhoodCSV(text)
        const buys = rows.filter(r => r['Trans Code'] === 'Buy' && r['Instrument'])
        const positions = buys.map(r => ({
          id: crypto.randomUUID(),
          ticker: r['Instrument'].trim().toUpperCase(),
          assetType: 'stock' as AssetType,
          shares: parseFloat(r['Quantity']) || 0,
          avgCost: parseFloat(r['Price']) || 0,
          dateAdded: r['Activity Date'] || new Date().toISOString().split('T')[0],
        }))
        store.importPositions(positions)
        toast.success(`Imported ${positions.length} positions from CSV`)
      } catch {
        toast.error('Failed to parse CSV. Make sure it is a Robinhood activity export.')
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Compute summary
  const totalCost = store.positions.reduce((s, p) => s + p.shares * p.avgCost, 0)
  const totalValue = store.positions.reduce((s, p) => {
    const cur = prices?.[p.ticker]?.price
    return s + p.shares * (cur ?? p.avgCost)
  }, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  // Pie chart data by asset type
  const pieData = Object.entries(
    store.positions.reduce((acc, p) => {
      const cost = p.shares * p.avgCost
      acc[p.assetType] = (acc[p.assetType] ?? 0) + cost
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '7px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Portfolio</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Track your positions and performance</div>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Value', value: fmt.currency(totalValue), color: '#f1f5f9' },
          { label: 'Total Cost', value: fmt.currency(totalCost), color: '#64748b' },
          { label: 'Total P&L', value: fmt.pnl(totalPnL), color: pnlColor(totalPnL) },
          { label: 'P&L %', value: fmt.pct(totalPnLPct), color: pnlColor(totalPnLPct) },
          { label: 'Positions', value: String(store.positions.length), color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <Card key={label} padding={14}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start', marginBottom: 20 }}>
        {/* Add Position Form */}
        <Card>
          <CardHeader title="Add Position" />
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Ticker *</label>
                <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="TSLA" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Name (optional)</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tesla Inc." style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Asset Type</label>
                <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value as AssetType }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="stock">Stock</option>
                  <option value="option">Option</option>
                  <option value="crypto">Crypto</option>
                  <option value="etf">ETF</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Shares / Contracts *</label>
                <input type="number" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} placeholder="10" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Avg Cost ($) *</label>
                <input type="number" value={form.avgCost} onChange={e => setForm(f => ({ ...f, avgCost: e.target.value }))} placeholder="150.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Date Added</label>
                <input type="date" value={form.dateAdded} onChange={e => setForm(f => ({ ...f, dateAdded: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Trade thesis…" style={inputStyle} />
            </div>
            <button type="submit" style={{
              background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 20px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              Add Position
            </button>
          </form>
        </Card>

        {/* CSV Import + Pie Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title="CSV Import" subtitle="Robinhood activity export" />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #1e1e2e', borderRadius: 8, padding: '20px', textAlign: 'center',
                cursor: 'pointer', color: '#64748b', fontSize: 12,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e2e')}
            >
              <Upload size={20} style={{ marginBottom: 6, opacity: 0.5 }} />
              <div>Click to upload Robinhood CSV</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Looks for Trans Code = "Buy"</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          </Card>

          {pieData.length > 0 && (
            <Card>
              <CardHeader title="Allocation by Type" />
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={ASSET_COLORS[entry.name as AssetType] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 6, fontSize: 11 }}
                    formatter={(v: number) => [fmt.currency(v), '']}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader title="Positions" subtitle={`${store.positions.length} total`} />
        {pricesLoading && tickers.length > 0 && <SkeletonCard rows={4} />}
        {store.positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
            No positions yet. Add one above or import a CSV.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Ticker', 'Type', 'Shares', 'Avg Cost', 'Current', 'Total Cost', 'P&L', '% of Portfolio', ''].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: h === '' ? 'center' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}
                      className={h === 'Ticker' ? '' : ''}>
                      {h === 'Ticker' ? <span style={{ textAlign: 'left', display: 'block' }}>{h}</span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.positions.map(p => {
                  const curPrice = prices?.[p.ticker]?.price
                  const totalCostPos = p.shares * p.avgCost
                  const curValue = curPrice ? p.shares * curPrice : null
                  const pnl = curValue !== null ? curValue - totalCostPos : null
                  const pnlPct = pnl !== null && totalCostPos > 0 ? (pnl / totalCostPos) * 100 : null
                  const portPct = totalValue > 0 && curValue !== null ? (curValue / totalValue) * 100 : null

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                      <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{p.ticker}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}><Badge variant={ASSET_VARIANTS[p.assetType]} size="xs">{p.assetType}</Badge></td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{p.shares}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.price(p.avgCost)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                        {curPrice ? fmt.price(curPrice) : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.currency(totalCostPos)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: pnl !== null ? pnlColor(pnl) : '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {pnl !== null ? `${fmt.pnl(pnl)} (${fmt.pct(pnlPct ?? 0)})` : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {portPct !== null ? `${portPct.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => store.remove(p.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
