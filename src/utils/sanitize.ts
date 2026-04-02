/** Sanitize a ticker symbol: uppercase, alphanumeric + . - ^, max 10 chars */
export function sanitizeTicker(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9.\-\^]/g, '')
    .slice(0, 10)
}

/** Sanitize a free-text note: strip HTML/script chars, max 200 chars */
export function sanitizeNote(value: string): string {
  return value
    .replace(/[<>"'`]/g, '')
    .slice(0, 200)
}

/** Sanitize a watchlist textarea: one ticker per line, each sanitized */
export function sanitizeWatchlist(value: string): string {
  return value
    .split('\n')
    .map(line => sanitizeTicker(line.trim()))
    .filter(Boolean)
    .slice(0, 50) // max 50 tickers
    .join('\n')
}

/** Clamp a number to a safe range */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
