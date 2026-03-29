import { useState } from 'react'
import { format, differenceInCalendarDays } from 'date-fns'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Download } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useJournalStore } from '../store/index'
import { pnlColor } from '../utils/format'
import type { TradeDirection, SetupType } from '../types/journal'

const SETUP_TYPES: SetupType[] = ['breakout', 'pullback', 'earnings', 'options-play', 'swing', 'scalp', 'other']

const EMPTY_FORM = {
  ticker: '', direction: 'long' as TradeDirection, assetType: 'stock' as 'stock' | 'option' | 'crypto',
  setupType: 'swing' as SetupType, entryPrice: '', exitPrice: '', shares: '',
  dateIn: new Date().toISOString().split('T')[0], dateOut: '', preNotes: '', postNotes: '',
}

export default function Journal() {
  const store = useJournalStore()
  const [form, setForm] = useState(EMPTY_FORM)

  const closed = store.entries.filter(e => e.exitPrice !== undefined && e.pnl !== undefined)
  const wins = closed.filter(e => (e.pnl ?? 0) > 0)
  const losses = closed.filter(e => (e.pnl ?? 0) < 0)
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0
  const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + (e.pnl ?? 0), 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, e) => s + (e.pnl ?? 0), 0) / losses.length) : 0
  const grossWin = wins.reduce((s, e) => s + (e.pnl ?? 0), 0)
  const grossLoss = Math.abs(losses.reduce((s, e) => s + (e.pnl ?? 0), 0))
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0
  const totalPnL = closed.reduce((s, e) => s + (e.pnl ?? 0), 0)

  // Equity curve
  const equityCurve = [...closed]
    .filter(e => e.dateOut)
    .sort((a, b) => new Date(a.dateOut!).getTime() - new Date(b.dateOut!).getTime())
    .reduce((acc, e) => {
      const prev = acc[acc.length - 1]?.cumPnL ?? 0
      acc.push({ date: e.dateOut!, cumPnL: parseFloat((prev + (e.pnl ?? 0)).toFixed(2)) })
      return acc
    }, [] as { date: string; cumPnL: number }[])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const entryPrice = parseFloat(form.entryPrice)
    const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : undefined
    const shares = parseFloat(form.shares)
    if (!form.ticker.trim() || isNaN(entryPrice) || isNaN(shares)) {
      toast.error('Ticker, entry price, and shares are required')
      return
    }
    const dir = form.direction
    const pnl = exitPrice !== undefined
      ? (exitPrice - entryPrice) * shares * (dir === 'long' ? 1 : -1)
      : undefined
    const pnlPct = pnl !== undefined ? (pnl / (entryPrice * shares)) * 100 : undefined
    const holdDays = form.dateOut
      ? differenceInCalendarDays(new Date(form.dateOut), new Date(form.dateIn))
      : undefined

    store.add({
      id: crypto.randomUUID(),
      ticker: form.ticker.trim().toUpperCase(),
      direction: dir,
      assetType: form.assetType,
      setupType: form.setupType,
      entryPrice,
      exitPrice,
      shares,
      dateIn: form.dateIn,
      dateOut: form.dateOut || undefined,
      preNotes: form.preNotes || undefined,
      postNotes: form.postNotes || undefined,
      pnl,
      pnlPct,
      holdDays,
    })
    setForm(EMPTY_FORM)
    toast.success('Trade logged')
  }

  function handleExport() {
    const rows = store.entries.map(e => ({
      Ticker: e.ticker,
      Direction: e.direction,
      'Asset Type': e.assetType,
      Setup: e.setupType,
      'Entry Price': e.entryPrice,
      'Exit Price': e.exitPrice ?? '',
      Shares: e.shares,
      'Date In': e.dateIn,
      'Date Out': e.dateOut ?? '',
      'P&L ($)': e.pnl ?? '',
      'P&L (%)': e.pnlPct ? e.pnlPct.toFixed(2) : '',
      'Hold Days': e.holdDays ?? '',
      'Pre-Notes': e.preNotes ?? '',
      'Post-Notes': e.postNotes ?? '',
    }))
    const summary = [{
      Ticker: 'SUMMARY',
      Direction: '', 'Asset Type': '', Setup: '',
      'Entry Price': '', 'Exit Price': '', Shares: '',
      'Date In': '', 'Date Out': '',
      'P&L ($)': totalPnL.toFixed(2),
      'P&L (%)': '',
      'Hold Days': '',
      'Pre-Notes': `Win Rate: ${winRate.toFixed(1)}%`,
      'Post-Notes': `Profit Factor: ${profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}`,
    }]
    const ws = XLSX.utils.json_to_sheet([...rows, {}, ...summary])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Trades')
    XLSX.writeFile(wb, 'jarvis-journal.xlsx')
    toast.success('Exported to jarvis-journal.xlsx')
  }

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '7px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Trade Journal</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Log, track, and review your trades</div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? '#22c55e' : '#ef4444' },
          { label: 'Total Trades', value: String(closed.length), color: '#f1f5f9' },
          { label: 'Avg Win', value: `$${avgWin.toFixed(2)}`, color: '#22c55e' },
          { label: 'Avg Loss', value: `$${avgLoss.toFixed(2)}`, color: '#ef4444' },
          { label: 'Profit Factor', value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2), color: profitFactor >= 1.5 ? '#22c55e' : '#f59e0b' },
          { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`, color: pnlColor(totalPnL) },
        ].map(({ label, value, color }) => (
          <Card key={label} padding={14}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Add Trade Form */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Log a Trade" />
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Ticker *</label>
              <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="TSLA" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Direction</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['long', 'short'] as TradeDirection[]).map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, direction: d }))}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: form.direction === d ? (d === 'long' ? '#22c55e' : '#ef4444') : '#1a1a2e',
                      color: form.direction === d ? '#fff' : '#64748b',
                    }}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Asset Type</label>
              <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="stock">Stock</option>
                <option value="option">Option</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Setup Type</label>
              <select value={form.setupType} onChange={e => setForm(f => ({ ...f, setupType: e.target.value as SetupType }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Entry Price *</label>
              <input type="number" step="any" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))} placeholder="150.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Exit Price</label>
              <input type="number" step="any" value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))} placeholder="160.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Shares *</label>
              <input type="number" step="any" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} placeholder="10" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Date In</label>
              <input type="date" value={form.dateIn} onChange={e => setForm(f => ({ ...f, dateIn: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Date Out</label>
              <input type="date" value={form.dateOut} onChange={e => setForm(f => ({ ...f, dateOut: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Pre-Trade Notes</label>
              <input value={form.preNotes} onChange={e => setForm(f => ({ ...f, preNotes: e.target.value }))} placeholder="Setup thesis…" style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Post-Trade Notes</label>
              <input value={form.postNotes} onChange={e => setForm(f => ({ ...f, postNotes: e.target.value }))} placeholder="What happened, lessons…" style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={{
            background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 20px',
            cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
          }}>
            Log Trade
          </button>
        </form>
      </Card>

      {/* Equity Curve */}
      {equityCurve.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <CardHeader title="Equity Curve" subtitle="Cumulative P&L from closed trades" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={equityCurve} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
              />
              <Line type="monotone" dataKey="cumPnL" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader
          title="Trade History"
          subtitle={`${store.entries.length} entries`}
          action={
            store.entries.length > 0 ? (
              <button
                onClick={handleExport}
                style={{
                  background: '#22c55e18', border: '1px solid #22c55e30', borderRadius: 6, padding: '5px 12px',
                  cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Download size={12} /> Export Excel
              </button>
            ) : null
          }
        />
        {store.entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
            No trades logged yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Ticker', 'Dir', 'Setup', 'Entry', 'Exit', 'P&L', 'R', 'Hold', 'Date In', ''].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Ticker' ? 'left' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...store.entries].sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()).map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <td style={{ padding: '7px 8px', color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{e.ticker}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                      <Badge variant={e.direction === 'long' ? 'green' : 'red'} size="xs">{e.direction.toUpperCase()}</Badge>
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>{e.setupType}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>${e.entryPrice.toFixed(2)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>
                      {e.exitPrice !== undefined ? `$${e.exitPrice.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: e.pnl !== undefined ? pnlColor(e.pnl) : '#64748b' }}>
                      {e.pnl !== undefined ? `${e.pnl >= 0 ? '+' : ''}$${e.pnl.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                      {e.rMultiple !== undefined ? `${e.rMultiple.toFixed(2)}R` : '—'}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>
                      {e.holdDays !== undefined ? `${e.holdDays}d` : '—'}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>
                      {format(new Date(e.dateIn), 'MMM d')}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => store.remove(e.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
