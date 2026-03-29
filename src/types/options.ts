export interface OptionContract {
  strike: number
  expiration: string
  expirationTimestamp: number
  type: 'call' | 'put'
  last: number
  bid: number
  ask: number
  mid: number
  volume: number
  openInterest: number
  iv: number
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  inTheMoney: boolean
}

export interface OptionsChain {
  ticker: string
  currentPrice: number
  expirations: string[]
  calls: OptionContract[]
  puts: OptionContract[]
}

export interface BlackScholesInputs {
  stockPrice: number
  strikePrice: number
  daysToExpiration: number
  impliedVolatility: number   // as decimal e.g. 0.30
  riskFreeRate: number        // as decimal e.g. 0.045
  optionType: 'call' | 'put'
}

export interface BlackScholesResult {
  price: number
  delta: number
  gamma: number
  theta: number     // per day
  vega: number
  rho: number
  intrinsicValue: number
  extrinsicValue: number
  probabilityOfProfit: number
  breakeven: number
}

export type StrategyType =
  | 'long-call'
  | 'long-put'
  | 'bull-call-spread'
  | 'bear-put-spread'
  | 'iron-condor'
  | 'covered-call'
  | 'cash-secured-put'
