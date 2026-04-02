import https from 'https'
import { rateLimit } from './_rateLimit.mjs'

const COIN_RE = /^[a-z0-9\-]{1,50}$/

export const handler = async (event) => {
  const blocked = rateLimit(event)
  if (blocked) return blocked

  const pathParts = (event.path || '').split('/').filter(Boolean)
  const coinId = (event.queryStringParameters?.coinId || pathParts.pop() || '').toLowerCase().trim()
  // Sanitize days: only allow known safe values
  const VALID_DAYS = ['1', '7', '14', '30', '90', '180', '365']
  const days = VALID_DAYS.includes(event.queryStringParameters?.days || '') ? event.queryStringParameters.days : '90'

  if (!coinId || coinId === 'crypto' || !COIN_RE.test(coinId)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid coin ID.' }) }
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
