import https from 'https'
import { rateLimit } from './_rateLimit.mjs'

const TICKER_RE = /^[A-Z0-9.\-\^]{1,10}$/

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

  // Sanitize: only valid tickers, max 20 symbols per request
  const symbols = (event.queryStringParameters?.symbols || '')
    .split(',')
    .map(s => s.toUpperCase().trim())
    .filter(s => TICKER_RE.test(s))
    .slice(0, 20)

  try {
    const results = {}
    await Promise.all(symbols.map(async sym => {
      try {
        const d = await yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`)
        const bars = d.chart?.result?.[0]
        if (!bars) return
        const closes = bars.indicators.quote[0].close.filter(Boolean)
        const price = closes[closes.length - 1]
        const prevPrice = closes[closes.length - 2] || price
        results[sym] = { price, changePct: ((price - prevPrice) / prevPrice) * 100 }
      } catch {}
    }))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results),
    }
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Quotes unavailable.' }) }
  }
}
