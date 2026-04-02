import https from 'https'

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
  const pathParts = (event.path || '').split('/').filter(Boolean)
  const ticker = (event.queryStringParameters?.ticker || pathParts.pop() || '').toUpperCase().trim()
  const expiration = event.queryStringParameters?.expiration || ''

  if (!ticker || ticker === 'options') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker is required.' }) }
  }

  try {
    const url = expiration
      ? `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?date=${expiration}`
      : `https://query1.finance.yahoo.com/v7/finance/options/${ticker}`
    const d = await yahooFetch(url)
    const result = d.optionChain?.result?.[0]
    if (!result) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Options chain not found.' }) }
    }

    const mapContract = (c, type) => ({
      strike: c.strike,
      expiration: c.expiration,
      expirationTimestamp: c.expiration,
      type,
      last: c.lastPrice,
      bid: c.bid,
      ask: c.ask,
      mid: (c.bid + c.ask) / 2,
      volume: c.volume || 0,
      openInterest: c.openInterest || 0,
      iv: c.impliedVolatility || 0,
      delta: null,
      gamma: null,
      theta: null,
      vega: null,
      inTheMoney: c.inTheMoney || false,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ticker,
        currentPrice: result.quote?.regularMarketPrice || 0,
        expirations: result.expirationDates || [],
        calls: (result.options?.[0]?.calls || []).map(c => mapContract(c, 'call')),
        puts: (result.options?.[0]?.puts || []).map(c => mapContract(c, 'put')),
      }),
    }
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Options data unavailable.' }) }
  }
}
