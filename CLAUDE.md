# JARVIS V2 Trading Analyzer — Claude Context

## Project
React 18 + TypeScript + Vite + Tailwind CSS v4 trading analyzer. Deployed on Netlify.
- **Live URL:** https://jarvis-trading-analyzer-v2.netlify.app
- **GitHub:** https://github.com/Mallu848/jarvis-trading-analyzer-v2
- **Netlify site ID:** 10d38001-8fea-45c3-b26c-0f5b013810a6

## Commands
```bash
npm run dev        # Vite dev server (port 5174) — requires npm run server in parallel
npm run server     # Express backend (port 3002)
npm run start      # Both together via start.js
npm run build      # Production build → dist/
```
Build check: `node node_modules/vite/bin/vite.js build 2>&1 | tail -8`

## Deploy to Netlify
1. Build passes
2. Call `mcp__claude_ai_Netlify__netlify-deploy-services-updater` with `deploy-site` + siteId
3. Run the `npx @netlify/mcp` command it returns from the v2 directory

## Stack & Key Decisions
- **No `any` types** — strict TypeScript throughout
- **Tailwind v4** via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **Zustand** with persist middleware for all client state (watchlist, alerts, portfolio, journal, settings)
- **TanStack Query v5** for all data fetching (staleTime 30s)
- **Recharts** for indicator charts, **lightweight-charts** for candlesticks
- **Black-Scholes** implemented from scratch in `src/lib/blackScholes.ts`
- **Technical indicators** from scratch in `src/lib/technicals.ts`
- **Windows path issue:** `&` in folder name breaks shell — always use `node node_modules/vite/bin/vite.js` directly, never `vite` CLI

## Design Tokens
| Token | Value |
|-------|-------|
| bg | `#0a0a0f` |
| card | `#12121a` |
| border | `#1e1e2e` |
| green | `#22c55e` |
| red | `#ef4444` |
| amber | `#f59e0b` |
| blue | `#3b82f6` |
| text-primary | `#f1f5f9` |
| text-muted | `#64748b` |

## File Map
```
src/
├── App.tsx                        # BrowserRouter, 10 routes
├── main.tsx                       # React root, QueryClientProvider, Toaster
├── index.css                      # @import tailwindcss, @theme tokens, utilities
├── api/
│   ├── client.ts                  # axios instance, baseURL '/api', 15s timeout
│   ├── yahoo.ts                   # fetchStockAnalysis, fetchQuotes, searchTickers, fetchOptionsChain
│   └── market.ts                  # fetchFearAndGreed, fetchMarketOverview, fetchCrypto
├── components/
│   ├── layout/
│   │   ├── Layout.tsx             # flex wrapper, mobile hamburger header, overlay
│   │   └── Sidebar.tsx            # desktop sidebar + mobile drawer, HUD reticle logo
│   └── ui/
│       ├── Card.tsx               # Card + CardHeader
│       ├── Badge.tsx              # 5 variants: green/red/amber/blue/muted
│       └── Skeleton.tsx           # Skeleton + SkeletonCard
├── lib/
│   ├── technicals.ts              # EMA, SMA, RSI, MACD, BB, ATR, S/R, FTFC, computeTechnicals
│   └── blackScholes.ts            # cdf, pdf, blackScholes(), positionSizer()
├── pages/
│   ├── Dashboard.tsx              # Market overview, watchlist, F&G index
│   ├── TradeAnalyzer.tsx          # Ticker search, chart, technicals, setup
│   ├── OptionsAnalyzer.tsx        # Chain table, Greeks, Black-Scholes calc
│   ├── Screener.tsx               # Multi-ticker scan
│   ├── Alerts.tsx                 # Price alerts, Zustand-persisted
│   ├── Portfolio.tsx              # Positions, P&L, CSV import
│   ├── Crypto.tsx                 # BTC/ETH/XRP/GRT charts via CoinGecko
│   ├── Journal.tsx                # Trade journal entries, stats
│   └── Settings.tsx               # Theme, defaults, data prefs
├── store/index.ts                 # useSettingsStore, useWatchlistStore, useAlertsStore,
│                                  # usePortfolioStore, useJournalStore, useRecentStore
├── types/
│   ├── market.ts                  # OHLCVBar, Quote, Technicals, TradeSetup, StockAnalysis
│   ├── options.ts                 # OptionContract, OptionsChain, BlackScholesInputs/Result
│   ├── portfolio.ts               # Position, PositionWithPnL, PortfolioSummary
│   ├── journal.ts                 # JournalEntry, JournalStats, TradeDirection, SetupType
│   └── alerts.ts                  # PriceAlert, AlertHistoryEntry, AlertCondition
└── utils/
    └── format.ts                  # fmt.{currency,price,pct,pnl,volume,marketCap,date}, pnlClass

netlify/functions/                 # Serverless functions (production API)
├── analyze.mjs                    # GET /api/analyze/:ticker → Yahoo daily+weekly OHLCV
├── options.mjs                    # GET /api/options/:ticker → options chain
├── quotes.mjs                     # GET /api/quotes?symbols=A,B → batch price+change
├── search.mjs                     # GET /api/search?q= → ticker search
├── market-overview.mjs            # GET /api/market-overview → SPY/QQQ/DIA/BTC/ETH/VIX
├── fng.mjs                        # GET /api/fng → Fear & Greed index
├── crypto.mjs                     # GET /api/crypto/:coinId → CoinGecko OHLC
└── health.mjs                     # GET /api/health → { ok: true }

server.js                          # Express dev proxy (port 3002) — same endpoints
start.js                           # Spawns server.js + vite without shell (avoids & path bug)
netlify.toml                       # Build config + redirect rules for all /api/* routes
```

## Mobile Layout
- `≤768px`: sidebar hidden, sticky top bar with hamburger button shown
- Hamburger opens mobile drawer (slides in from left, z-50)
- Dark overlay behind drawer closes it on tap
- Each NavLink calls `onClose()` on click

## Efficiency Notes for Claude
- Use `Grep` to locate specific functions before `Read` — avoid reading full files
- Use `Edit` (diff) over `Write` (full file) for existing files
- Build output: always pipe to `| tail -8` or `| tail -10`
- Netlify deploy tokens expire — always call `netlify-deploy-services-updater` first to get a fresh one
