import https from 'https'
import { rateLimit } from './_rateLimit.mjs'

export const handler = async (event) => {
  const blocked = rateLimit(event)
  if (blocked) return blocked
  return new Promise(resolve => {
    https.get('https://api.alternative.me/fng/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, r => {
      let data = ''
      r.on('data', c => data += c)
      r.on('end', () => {
        try {
          const json = JSON.parse(data)
          const item = json.data?.[0]
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ value: parseInt(item.value), label: item.value_classification }),
          })
        } catch {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'FNG unavailable.' }) })
        }
      })
    }).on('error', () => resolve({ statusCode: 500, body: JSON.stringify({ error: 'FNG unavailable.' }) }))
  })
}
