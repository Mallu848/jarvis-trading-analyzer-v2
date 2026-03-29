import https from 'https'

export const handler = async (event) => {
  const pathParts = (event.path || '').split('/').filter(Boolean)
  const coinId = event.queryStringParameters?.coinId || pathParts.pop() || ''
  const days = event.queryStringParameters?.days || '90'

  if (!coinId || coinId === 'crypto') {
    return { statusCode: 400, body: JSON.stringify({ error: 'coinId is required.' }) }
  }

  return new Promise(resolve => {
    https.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      r => {
        let data = ''
        r.on('data', c => data += c)
        r.on('end', () => {
          try {
            const raw = JSON.parse(data)
            const bars = raw.map(([ts, o, h, l, c]) => ({
              date: Math.floor(ts / 1000), open: o, high: h, low: l, close: c, volume: 0
            }))
            resolve({
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ coinId, bars }),
            })
          } catch {
            resolve({ statusCode: 500, body: JSON.stringify({ error: 'Crypto data unavailable.' }) })
          }
        })
      }
    ).on('error', () => resolve({ statusCode: 500, body: JSON.stringify({ error: 'Crypto data unavailable.' }) }))
  })
}
