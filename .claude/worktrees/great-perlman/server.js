import express from 'express'
import cors from 'cors'
import https from 'https'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

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

// ─── Analyze endpoint ─────────────────────────────────────────────────────────
app.get('/api/analyze/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase().trim()
  try {
    const [daily, weekly] = await Promise.all([
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`),
      yahooFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=1y`),
    ])

    if (!daily.chart?.result?.[0]) return res.status(404).json({ error: `"${ticker}" not found.` })

    const meta = daily.chart.result[0].meta
    let earningsDate = null
    try {
      const cal = await yahooFetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`)
      const e = cal?.quoteSummary?.result?.[0]?.calendarEvents?.earnings?.earningsDate
      if (e?.length) earningsDate = e[0].raw
    } catch {}

    res.json({
      ticker,
      name: meta.longName || meta.shortName || ticker,
      dailyData: parseOHLCV(daily.chart.result[0]),
      weeklyData: parseOHLCV(weekly.chart.result[0]),
      earningsDate,
    })
  } catch (e) {
    res.status(500).json({ error: 'Data unavailable — try again.' })
  }
})

// ─── Quotes (batch) ───────────────────────────────────────────────────────────
app.get('/api/quotes', async (req, res) => {
  const symbols = (req.query.symbols || '').split(',').filter(Boolean)
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
    res.json(results)
  } catch (e) {
    res.status(500).json({ error: 'Quotes unavailable.' })
  }
})

// ─── Search ───────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = req.query.q || ''
  try {
    const d = await yahooFetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`)
    const results = (d.quotes || []).map(r => ({
      ticker: r.symbol, name: r.longname || r.shortname || r.symbol,
      exchange: r.exchange, type: r.quoteType,
    }))
    res.json(results)
  } catch (e) {
    res.status(500).json({ error: 'Search unavailable.' })
  }
})

// ─── Options chain ────────────────────────────────────────────────────────────
app.get('/api/options/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const expiration = req.query.expiration || ''
  try {
    const url = expiration
      ? `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?date=${expiration}`
      : `https://query1.finance.yahoo.com/v7/finance/options/${ticker}`
    const d = await yahooFetch(url)
    const result = d.optionChain?.result?.[0]
    if (!result) return res.status(404).json({ error: 'Options chain not found.' })

    const mapContract = (c, type) => ({
      strike: c.strike, expiration: c.expiration,
      expirationTimestamp: c.expiration, type,
      last: c.lastPrice, bid: c.bid, ask: c.ask,
      mid: (c.bid + c.ask) / 2,
      volume: c.volume || 0, openInterest: c.openInterest || 0,
      iv: c.impliedVolatility || 0,
      delta: null, gamma: null, theta: null, vega: null,
      inTheMoney: c.inTheMoney || false,
    })

    res.json({
      ticker,
      currentPrice: result.underlyingSymbol ? result.quote?.regularMarketPrice || 0 : 0,
      expirations: result.expirationDates || [],
      calls: (result.options?.[0]?.calls || []).map(c => mapContract(c, 'call')),
      puts: (result.options?.[0]?.puts || []).map(c => mapContract(c, 'put')),
    })
  } catch (e) {
    res.status(500).json({ error: 'Options data unavailable.' })
  }
})

// ─── Market overview ──────────────────────────────────────────────────────────
app.get('/api/market-overview', async (req, res) => {
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
    res.json(results.filter(Boolean))
  } catch (e) {
    res.status(500).json({ error: 'Market data unavailable.' })
  }
})

// ─── Fear & Greed ─────────────────────────────────────────────────────────────
app.get('/api/fng', (req, res) => {
  https.get('https://api.alternative.me/fng/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, r => {
    let data = ''
    r.on('data', c => data += c)
    r.on('end', () => {
      try {
        const json = JSON.parse(data)
        const item = json.data?.[0]
        res.json({ value: parseInt(item.value), label: item.value_classification })
      } catch { res.status(500).json({ error: 'FNG unavailable.' }) }
    })
  }).on('error', () => res.status(500).json({ error: 'FNG unavailable.' }))
})

// ─── Crypto (CoinGecko) ───────────────────────────────────────────────────────
app.get('/api/crypto/:coinId', async (req, res) => {
  const { coinId } = req.params
  const days = req.query.days || 90
  try {
    const d = await new Promise((resolve, reject) => {
      https.get(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, r => {
        let data = ''
        r.on('data', c => data += c)
        r.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
      }).on('error', reject)
    })
    // CoinGecko OHLC: [timestamp, open, high, low, close]
    const bars = d.map(([ts, o, h, l, c]) => ({
      date: Math.floor(ts / 1000), open: o, high: h, low: l, close: c, volume: 0
    }))
    res.json({ coinId, bars })
  } catch (e) {
    res.status(500).json({ error: 'Crypto data unavailable.' })
  }
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`\n  JARVIS V2 backend → http://localhost:${PORT}\n`))
