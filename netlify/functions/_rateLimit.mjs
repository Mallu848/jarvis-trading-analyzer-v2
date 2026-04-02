/**
 * In-memory rate limiter for Netlify serverless functions.
 * Limits each IP to RATE_LIMIT_RPM requests per minute (default 30).
 * Works per warm Lambda instance — good enough to stop burst abuse.
 */

const RPM = parseInt(process.env.RATE_LIMIT_RPM || '30', 10)
const WINDOW_MS = 60_000

// Map<ip, { count: number, resetAt: number }>
const store = new Map()

// Clean up stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, rec] of store) {
    if (now > rec.resetAt) store.delete(ip)
  }
}, 300_000)

/**
 * Returns a 429 response object if the IP is over the limit, otherwise null.
 * Usage: const blocked = rateLimit(event); if (blocked) return blocked;
 */
export function rateLimit(event) {
  const ip =
    event.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
    event.headers?.['client-ip'] ||
    'unknown'

  const now = Date.now()
  const rec = store.get(ip)

  if (!rec || now > rec.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }

  rec.count++
  if (rec.count > RPM) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    }
  }

  return null
}
