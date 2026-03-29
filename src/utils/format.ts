export const fmt = {
  currency: (v: number, decimals = 2) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v),

  price: (v: number) => {
    if (v >= 1000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (v >= 1) return `$${v.toFixed(2)}`
    return `$${v.toFixed(4)}`
  },

  pct: (v: number, showSign = true) => {
    const sign = showSign && v > 0 ? '+' : ''
    return `${sign}${v.toFixed(2)}%`
  },

  pnl: (v: number) => {
    const sign = v >= 0 ? '+' : ''
    return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },

  volume: (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return v.toString()
  },

  marketCap: (v: number) => {
    if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
    return `$${v.toLocaleString()}`
  },

  date: (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),

  dateShort: (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

  number: (v: number, decimals = 2) => v.toFixed(decimals),
}

export function pnlColor(v: number): string {
  if (v > 0) return '#22c55e'
  if (v < 0) return '#ef4444'
  return '#64748b'
}

export function pnlClass(v: number): string {
  if (v > 0) return 'text-positive'
  if (v < 0) return 'text-negative'
  return 'text-neutral'
}
