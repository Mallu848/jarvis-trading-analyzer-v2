import type { BlackScholesInputs, BlackScholesResult } from '../types/options'

// Cumulative standard normal distribution (Hart approximation)
function cdf(x: number): number {
  if (x < -8) return 0
  if (x > 8) return 1
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const t = 1 / (1 + p * Math.abs(x) / Math.SQRT2)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2)
  return 0.5 * (1 + sign * y)
}

// Standard normal PDF
function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

export function blackScholes(inputs: BlackScholesInputs): BlackScholesResult {
  const { stockPrice: S, strikePrice: K, daysToExpiration, impliedVolatility: sigma, riskFreeRate: r, optionType } = inputs
  const T = daysToExpiration / 365
  const isCall = optionType === 'call'

  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsic = isCall ? Math.max(S - K, 0) : Math.max(K - S, 0)
    return { price: intrinsic, delta: isCall ? (S > K ? 1 : 0) : (K > S ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0, intrinsicValue: intrinsic, extrinsicValue: 0, probabilityOfProfit: intrinsic > 0 ? 1 : 0, breakeven: isCall ? K : K }
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + sigma ** 2 / 2) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT

  let price: number, delta: number, rho: number

  if (isCall) {
    price = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2)
    delta = cdf(d1)
    rho = K * T * Math.exp(-r * T) * cdf(d2) / 100
  } else {
    price = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1)
    delta = cdf(d1) - 1
    rho = -K * T * Math.exp(-r * T) * cdf(-d2) / 100
  }

  const gamma = pdf(d1) / (S * sigma * sqrtT)
  const theta = isCall
    ? (-(S * pdf(d1) * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * cdf(d2)) / 365
    : (-(S * pdf(d1) * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * cdf(-d2)) / 365
  const vega = S * pdf(d1) * sqrtT / 100

  const intrinsicValue = isCall ? Math.max(S - K, 0) : Math.max(K - S, 0)
  const extrinsicValue = Math.max(price - intrinsicValue, 0)
  const breakeven = isCall ? K + price : K - price
  const probabilityOfProfit = isCall ? cdf(d2) : cdf(-d2)

  return { price, delta, gamma, theta, vega, rho, intrinsicValue, extrinsicValue, probabilityOfProfit, breakeven }
}

export function positionSizer(accountSize: number, riskPct: number, entry: number, stop: number): {
  maxRisk: number
  shares: number
  totalCost: number
} {
  const maxRisk = accountSize * (riskPct / 100)
  const riskPerShare = Math.abs(entry - stop)
  const shares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0
  return { maxRisk, shares, totalCost: shares * entry }
}
