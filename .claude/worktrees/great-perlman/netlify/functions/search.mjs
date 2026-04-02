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
  const q = event.queryStringParameters?.q || ''
  try {
    const d = await yahooFetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`
    )
    const results = (d.quotes || []).map(r => ({
      ticker: r.symbol,
      name: r.longname || r.shortname || r.symbol,
      exchange: r.exchange,
      type: r.quoteType,
    }))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results),
    }
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Search unavailable.' }) }
  }
}
