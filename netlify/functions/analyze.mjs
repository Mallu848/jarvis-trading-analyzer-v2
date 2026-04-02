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

function parseOHLCV(result) {
  const ts = result.timestamp
  const q = result.indicators.quote[0]
  return ts.map((t, i) => ({
    date: t, open: q.open[i], high: q.high[i],
    low: q.low[i], close: q.close[i], volume: q.volume[i],
  })).filter(d => d.close !== null && !isNaN(d.close))
}

export const handler = async (event) => {
  const blocked = rateLimit(event)
  if (blocked) return blocked

  const pathParts = (event.path || '').split('/').filter(Boolean)
  const ticker = (event.queryStringParameters?.ticker || pathParts.pop() || '').toUpperCase().trim()

  if (!ticker || ticker === 'analyze' || !TICKER_RE.test(ticker)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ticker symbol.' }) }
  }

  try {
    const [daily, weekly] = await Promise.all([
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`),
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=1y`),
    ])

    if (!daily.chart?.result?.[0]) {
      return { statusCode: 404, body: JSON.stringify({ error: `"${ticker}" not found.` }) }
    }

    const meta = daily.chart.result[0].meta
    let earningsDate = null
    try {
      const cal = await yahooFetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`)
      const e = cal?.quoteSummary?.result?.[0]?.calendarEvents?.earnings?.earningsDate
      if (e?.length) earningsDate = e[0].raw
    } catch {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ticker,
        name: meta.longName || meta.shortName || ticker,
        dailyData: parseOHLCV(daily.chart.result[0]),
        weeklyData: parseOHLCV(weekly.chart.result[0]),
        earningsDate,
      }),
    }
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Data unavailable — try again.' }) }
  }
}
