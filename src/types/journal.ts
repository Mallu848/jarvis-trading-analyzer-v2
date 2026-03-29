export type TradeDirection = 'long' | 'short'
export type SetupType = 'breakout' | 'pullback' | 'earnings' | 'options-play' | 'swing' | 'scalp' | 'other'

export interface JournalEntry {
  id: string
  ticker: string
  direction: TradeDirection
  assetType: 'stock' | 'option' | 'crypto'
  setupType: SetupType
  entryPrice: number
  exitPrice?: number
  shares: number
  dateIn: string    // ISO
  dateOut?: string  // ISO
  preNotes?: string
  postNotes?: string
  // computed
  pnl?: number
  pnlPct?: number
  rMultiple?: number    // how many R's gained/lost
  holdDays?: number
}

export interface JournalStats {
  totalTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  totalPnL: number
  winStreak: number
  lossStreak: number
  bestTrade: JournalEntry | null
  worstTrade: JournalEntry | null
  bySetupType: Record<SetupType, { count: number; winRate: number; avgPnL: number }>
}
