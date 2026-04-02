import https from 'https'
import { rateLimit } from './_rateLimit.mjs'

function yahooFetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

export const handler = async (event) => {
  const blocked = rateLimit(event)
  if (blocked) return blocked
  const symbols = ['SPY', 'QQQ', 'DIA', 'BTC-USD', 'ETH-USD', '^VIX']
  const labels  = ['S&P 500', 'NASDAQ', 'DOW', 'Bitcoin', 'Ethereum', 'VIX']
  try {
    const results = await Promise.all(symbols.map(async (sym, i) => {
      try {
        const d = await yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`)
        const bars = d.chart?.result?.[0]
        if (!bars) return null
        const closes = bars.indicators.quote[0].close.filter(Boolean)
        const price = closes[closes.length - 1]
        const prev = closes[closes.length - 2] || price
        return { symbol: sym, label: labels[i], price, changePct: ((price - prev) / prev) * 100 }
      } catch { return null }
    }))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results.filter(Boolean)),
    }
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Market data unavailable.' }) }
  }
}
