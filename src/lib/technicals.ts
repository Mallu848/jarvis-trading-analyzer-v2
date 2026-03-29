import type { OHLCVBar, Technicals, TradeSetup } from '../types/market'

// ─── Moving Averages ──────────────────────────────────────────────────────────

export function calcEMA(closes: number[], period: number): (number | null)[] {
  if (closes.length < period) return closes.map(() => null)
  const k = 2 / (period + 1)
  const result: (number | null)[] = new Array(period - 1).fill(null)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(ema)
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

// ─── RSI ─────────────────────────────────────────────────────────────────────

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null)
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  if (gains.length < period) return closes.map(() => null)

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  const pushRSI = () => {
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - 100 / (1 + rs)
  }

  result.push(pushRSI())

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    result.push(pushRSI())
  }

  return result
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

export function calcMACD(closes: number[]): { macd: number | null; signal: number | null; histogram: number | null }[] {
  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  const macdLine = closes.map((_, i) => {
    const e12 = ema12[i]
    const e26 = ema26[i]
    return e12 !== null && e26 !== null ? e12 - e26 : null
  })

  const macdValues = macdLine.filter((v): v is number => v !== null)
  const signalRaw = calcEMA(macdValues, 9)
  const nullCount = macdLine.filter(v => v === null).length
  const signal: (number | null)[] = new Array(nullCount).fill(null).concat(signalRaw)

  return closes.map((_, i) => {
    const m = macdLine[i]
    const s = signal[i]
    return {
      macd: m,
      signal: s,
      histogram: m !== null && s !== null ? m - s : null,
    }
  })
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

export function calcBollingerBands(closes: number[], period = 20, mult = 2) {
  const middle = calcSMA(closes, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []

  closes.forEach((_, i) => {
    if (i < period - 1) { upper.push(null); lower.push(null); return }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    const m = middle[i]!
    upper.push(m + mult * std)
    lower.push(m - mult * std)
  })

  return { upper, middle, lower }
}

// ─── ATR ─────────────────────────────────────────────────────────────────────

export function calcATR(bars: OHLCVBar[], period = 14): (number | null)[] {
  const trueRanges: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const { high, low } = bars[i]
    const prevClose = bars[i - 1].close
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }

  const result: (number | null)[] = [null]
  if (trueRanges.length < period) return bars.map(() => null)

  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(...new Array(period - 1).fill(null))
  result.push(atr)

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period
    result.push(atr)
  }

  return result
}

// ─── Support & Resistance ─────────────────────────────────────────────────────

export function calcSupportResistance(bars: OHLCVBar[], lookback = 90, window = 5) {
  const slice = bars.slice(-lookback)
  const highs: number[] = []
  const lows: number[] = []

  for (let i = window; i < slice.length - window; i++) {
    const curr = slice[i]
    const prevHighs = slice.slice(i - window, i).map(b => b.high)
    const nextHighs = slice.slice(i + 1, i + window + 1).map(b => b.high)
    const prevLows = slice.slice(i - window, i).map(b => b.low)
    const nextLows = slice.slice(i + 1, i + window + 1).map(b => b.low)

    if (curr.high > Math.max(...prevHighs) && curr.high > Math.max(...nextHighs)) highs.push(curr.high)
    if (curr.low < Math.min(...prevLows) && curr.low < Math.min(...nextLows)) lows.push(curr.low)
  }

  // Cluster within 1%
  const cluster = (levels: number[]) => {
    const sorted = [...levels].sort((a, b) => a - b)
    const clusters: number[] = []
    let i = 0
    while (i < sorted.length) {
      const group = [sorted[i]]
      while (i + 1 < sorted.length && (sorted[i + 1] - sorted[i]) / sorted[i] < 0.01) {
        i++; group.push(sorted[i])
      }
      clusters.push(group.reduce((a, b) => a + b, 0) / group.length)
      i++
    }
    return clusters
  }

  const currentPrice = slice[slice.length - 1].close
  const resistances = cluster(highs).filter(h => h > currentPrice).sort((a, b) => a - b)
  const supports = cluster(lows).filter(l => l < currentPrice).sort((a, b) => b - a)

  return { resistanceLevels: resistances.slice(0, 5), supportLevels: supports.slice(0, 5) }
}

// ─── Trend Detection ──────────────────────────────────────────────────────────

export function detectTrend(
  price: number,
  sma20: number | null,
  sma50: number | null,
  sma200: number | null
): Technicals['trend'] {
  if (!sma20 || !sma50 || !sma200) return 'mixed'
  if (price > sma20 && price > sma50 && price > sma200) return 'strong-uptrend'
  if (price > sma20 && price > sma50 && price < sma200) return 'uptrend'
  if (price < sma20 && price > sma50 && price > sma200) return 'pullback'
  if (price < sma20 && price < sma50 && price > sma200) return 'recovery'
  if (price < sma20 && price < sma50 && price < sma200) return 'downtrend'
  return 'mixed'
}

// ─── Weekly High/Low ──────────────────────────────────────────────────────────

export function calcWeeklyLevels(daily: OHLCVBar[]) {
  const last5 = daily.slice(-5)
  return {
    weeklyHigh: Math.max(...last5.map(b => b.high)),
    weeklyLow: Math.min(...last5.map(b => b.low)),
  }
}

// ─── Monthly Open ─────────────────────────────────────────────────────────────

export function calcMonthlyOpen(daily: OHLCVBar[]): number {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const monthBars = daily.filter(b => {
    const d = new Date(b.date * 1000)
    return d.getMonth() === month && d.getFullYear() === year
  })
  return monthBars.length > 0 ? monthBars[0].open : daily[daily.length - 1].open
}

// ─── FTFC ─────────────────────────────────────────────────────────────────────

export function calcFTFC(daily: OHLCVBar[], weekly: OHLCVBar[]): 'GREEN' | 'RED' | 'MIXED' {
  const dailyBull = daily[daily.length - 1].close > daily[daily.length - 1].open
  const weeklyBull = weekly[weekly.length - 1].close > weekly[weekly.length - 1].open
  const now = new Date()
  const monthBars = daily.filter(b => new Date(b.date * 1000).getMonth() === now.getMonth())
  const monthlyBull = monthBars.length > 0
    ? monthBars[monthBars.length - 1].close >= monthBars[0].open
    : dailyBull

  if (dailyBull && weeklyBull && monthlyBull) return 'GREEN'
  if (!dailyBull && !weeklyBull && !monthlyBull) return 'RED'
  return 'MIXED'
}

// ─── Full Technicals Runner ───────────────────────────────────────────────────

export function computeTechnicals(daily: OHLCVBar[], weekly: OHLCVBar[]): Technicals {
  const closes = daily.map(b => b.close)
  const ema5 = calcEMA(closes, 5)
  const ema9 = calcEMA(closes, 9)
  const ema21 = calcEMA(closes, 21)
  const sma20 = calcSMA(closes, 20)
  const sma50 = calcSMA(closes, 50)
  const sma200 = calcSMA(closes, 200)
  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const bb = calcBollingerBands(closes)
  const atr = calcATR(daily)
  const { supportLevels, resistanceLevels } = calcSupportResistance(daily)
  const { weeklyHigh, weeklyLow } = calcWeeklyLevels(daily)
  const monthlyOpen = calcMonthlyOpen(daily)
  const ftfc = calcFTFC(daily, weekly)

  const last = daily[daily.length - 1]
  const lastSma20 = sma20[sma20.length - 1]
  const lastSma50 = sma50[sma50.length - 1]
  const lastSma200 = sma200[sma200.length - 1]
  const trend = detectTrend(last.close, lastSma20, lastSma50, lastSma200)

  const last20Vols = daily.slice(-20).map(b => b.volume)
  const avgVol = last20Vols.reduce((a, b) => a + b, 0) / 20
  const volumeRatio = last.volume / avgVol

  const momentum5d = daily.length >= 6
    ? ((daily[daily.length - 1].close - daily[daily.length - 6].close) / daily[daily.length - 6].close) * 100
    : 0

  return {
    ema5, ema9, ema21, sma20, sma50, sma200,
    rsi, macd,
    bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower,
    atr,
    supportLevels, resistanceLevels,
    weeklyHigh, weeklyLow, monthlyOpen,
    trend, ftfc, volumeRatio, momentum5d,
  }
}

// ─── Trade Setup ──────────────────────────────────────────────────────────────

export function computeTradeSetup(daily: OHLCVBar[], tech: Technicals): TradeSetup {
  const price = daily[daily.length - 1].close
  const lastRSI = tech.rsi.filter(v => v !== null).at(-1) ?? null
  const lastATR = tech.atr.filter(v => v !== null).at(-1) ?? null
  const lastSma20 = tech.sma20.filter(v => v !== null).at(-1) ?? price
  const lastSma50 = tech.sma50.filter(v => v !== null).at(-1) ?? price

  const atr = lastATR ?? price * 0.02
  const stopTight = price - atr
  const stopNormal = price - atr * 2
  const stopWide = lastSma50 ?? price - atr * 3

  const r1 = price - stopNormal  // 1R
  const target1 = price + r1 * 2
  const target2 = price + r1 * 3
  const target3 = tech.resistanceLevels[0] ?? price * 1.08
  const riskRewardT1 = r1 > 0 ? (target1 - price) / r1 : 0

  // Quality score
  let quality = 0
  const isBullish = ['strong-uptrend', 'uptrend'].includes(tech.trend)
  if (isBullish) quality++
  if (tech.volumeRatio >= 1.2) quality++
  if (lastRSI !== null && lastRSI > 40 && lastRSI < 70) quality++
  if (tech.ftfc === 'GREEN') quality++
  if (tech.momentum5d > 0) quality++

  const trendLabel = {
    'strong-uptrend': '📈 STRONG UPTREND (above all MAs)',
    'uptrend': '📈 UPTREND (above SMA20 + SMA50)',
    'pullback': '↩️ PULLBACK (below SMA20, above SMA50)',
    'recovery': '🔄 RECOVERY (testing SMA200)',
    'downtrend': '📉 DOWNTREND (below all MAs)',
    'mixed': '↔️ MIXED (no clear direction)',
  }[tech.trend]

  const rsiLabel = lastRSI !== null
    ? lastRSI > 70 ? 'Overbought — caution' : lastRSI < 30 ? 'Oversold — potential bounce' : 'Neutral — room to run'
    : 'N/A'

  let verdict = 'NEUTRAL'
  if (quality >= 4 && isBullish) verdict = 'BUY'
  else if (quality >= 3 && isBullish) verdict = 'CAUTIOUS BUY'
  else if (quality <= 1) verdict = 'AVOID'
  else if (!isBullish && tech.ftfc === 'RED') verdict = 'BEARISH'

  const bullsNeed = `Price to hold above $${(lastSma20 ?? price * 0.97).toFixed(2)} on any pullback`
  const bearsWin = `Price closes below SMA50 at $${(lastSma50 ?? price * 0.95).toFixed(2)}`
  const bestSetup = isBullish
    ? `Buy near $${price.toFixed(2)} with stop at $${stopNormal.toFixed(2)} (2× ATR). Target $${target1.toFixed(2)}–$${target2.toFixed(2)}. R:R ${riskRewardT1.toFixed(1)}:1`
    : `Wait for a clearer setup. Current trend does not support a high-conviction entry.`

  return {
    currentPrice: price,
    trend: trendLabel,
    rsiValue: lastRSI,
    atrValue: lastATR,
    entryAggressive: price,
    entryConservative: lastSma20 ?? price * 0.98,
    entryStrong: lastSma50 ?? price * 0.95,
    stopTight,
    stopNormal,
    stopWide: typeof stopWide === 'number' ? stopWide : price * 0.94,
    target1,
    target2,
    target3,
    riskRewardT1,
    setupQuality: quality,
    verdict,
    verdictDetail: `RSI ${lastRSI?.toFixed(0) ?? 'N/A'} — ${rsiLabel}. FTFC ${tech.ftfc}. Volume ${(tech.volumeRatio * 100).toFixed(0)}% of average.`,
    bullsNeed,
    bearsWin,
    bestSetup,
  }
}
