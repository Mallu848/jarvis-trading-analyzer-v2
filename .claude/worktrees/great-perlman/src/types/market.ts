export interface OHLCVBar {
  date: number      // unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Quote {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  marketCap?: number
  exchange?: string
  earningsDate?: number | null
}

export interface MarketOverviewItem {
  symbol: string
  label: string
  price: number
  changePct: number
}

export interface Technicals {
  ema5: (number | null)[]
  ema9: (number | null)[]
  ema21: (number | null)[]
  sma20: (number | null)[]
  sma50: (number | null)[]
  sma200: (number | null)[]
  rsi: (number | null)[]
  macd: { macd: number | null; signal: number | null; histogram: number | null }[]
  bbUpper: (number | null)[]
  bbMiddle: (number | null)[]
  bbLower: (number | null)[]
  atr: (number | null)[]
  supportLevels: number[]
  resistanceLevels: number[]
  weeklyHigh: number
  weeklyLow: number
  monthlyOpen: number
  trend: 'strong-uptrend' | 'uptrend' | 'pullback' | 'recovery' | 'downtrend' | 'mixed'
  ftfc: 'GREEN' | 'RED' | 'MIXED'
  volumeRatio: number
  momentum5d: number
}

export interface TradeSetup {
  currentPrice: number
  trend: string
  rsiValue: number | null
  atrValue: number | null
  entryAggressive: number
  entryConservative: number
  entryStrong: number
  stopTight: number
  stopNormal: number
  stopWide: number
  target1: number
  target2: number
  target3: number
  riskRewardT1: number
  setupQuality: number    // 0–5
  verdict: string
  verdictDetail: string
  bullsNeed: string
  bearsWin: string
  bestSetup: string
}

export interface SearchResult {
  ticker: string
  name: string
  exchange: string
  type: string
}

export interface StockAnalysis {
  ticker: string
  quote: Quote
  dailyData: OHLCVBar[]
  weeklyData: OHLCVBar[]
  technicals: Technicals
  tradeSetup: TradeSetup
  earningsDate: number | null
}
