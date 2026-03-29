export type AssetType = 'stock' | 'option' | 'crypto' | 'etf'

export interface Position {
  id: string
  ticker: string
  name?: string
  assetType: AssetType
  shares: number          // or contracts for options
  avgCost: number         // cost per share/contract
  currentPrice?: number   // fetched live
  dateAdded: string       // ISO date
  notes?: string
  sector?: string
}

export interface PositionWithPnL extends Position {
  currentPrice: number
  totalCost: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPct: number
  dayChange?: number
  dayChangePct?: number
  portfolioPct: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPct: number
  dayPnL: number
  dayPnLPct: number
  positions: PositionWithPnL[]
}

// Robinhood CSV row shape
export interface RobinhoodCSVRow {
  'Activity Date': string
  'Process Date': string
  'Settle Date': string
  'Instrument': string
  'Description': string
  'Trans Code': string
  'Quantity': string
  'Price': string
  'Amount': string
}
