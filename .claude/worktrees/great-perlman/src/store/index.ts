import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PriceAlert, AlertHistoryEntry } from '../types/alerts'
import type { Position } from '../types/portfolio'
import type { JournalEntry } from '../types/journal'

// ─── Settings Store ───────────────────────────────────────────────────────────
interface SettingsState {
  accountSize: number
  riskPct: number
  defaultWatchlist: string[]
  timezone: string
  notificationsEnabled: boolean
  setAccountSize: (v: number) => void
  setRiskPct: (v: number) => void
  setDefaultWatchlist: (tickers: string[]) => void
  setNotifications: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accountSize: 500,
      riskPct: 2,
      defaultWatchlist: ['TSLA', 'AAPL', 'NVDA', 'SPY', 'QQQ'],
      timezone: 'America/Chicago',
      notificationsEnabled: false,
      setAccountSize: (v) => set({ accountSize: v }),
      setRiskPct: (v) => set({ riskPct: v }),
      setDefaultWatchlist: (tickers) => set({ defaultWatchlist: tickers }),
      setNotifications: (v) => set({ notificationsEnabled: v }),
    }),
    { name: 'jarvis-settings' }
  )
)

// ─── Watchlist Store ──────────────────────────────────────────────────────────
interface WatchlistState {
  tickers: string[]
  add: (ticker: string) => void
  remove: (ticker: string) => void
  has: (ticker: string) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: ['TSLA', 'AAPL', 'NVDA', 'SPY', 'QQQ'],
      add: (ticker) => set(s => ({ tickers: s.tickers.includes(ticker) ? s.tickers : [...s.tickers, ticker] })),
      remove: (ticker) => set(s => ({ tickers: s.tickers.filter(t => t !== ticker) })),
      has: (ticker) => get().tickers.includes(ticker),
    }),
    { name: 'jarvis-watchlist' }
  )
)

// ─── Alerts Store ─────────────────────────────────────────────────────────────
interface AlertsState {
  alerts: PriceAlert[]
  history: AlertHistoryEntry[]
  add: (alert: PriceAlert) => void
  remove: (id: string) => void
  update: (id: string, patch: Partial<PriceAlert>) => void
  addHistory: (entry: AlertHistoryEntry) => void
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      history: [],
      add: (alert) => set(s => ({ alerts: [...s.alerts, alert] })),
      remove: (id) => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),
      update: (id, patch) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, ...patch } : a) })),
      addHistory: (entry) => set(s => ({ history: [entry, ...s.history].slice(0, 100) })),
    }),
    { name: 'jarvis-alerts' }
  )
)

// ─── Portfolio Store ──────────────────────────────────────────────────────────
interface PortfolioState {
  positions: Position[]
  add: (p: Position) => void
  remove: (id: string) => void
  update: (id: string, patch: Partial<Position>) => void
  importPositions: (positions: Position[]) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: [],
      add: (p) => set(s => ({ positions: [...s.positions, p] })),
      remove: (id) => set(s => ({ positions: s.positions.filter(p => p.id !== id) })),
      update: (id, patch) => set(s => ({ positions: s.positions.map(p => p.id === id ? { ...p, ...patch } : p) })),
      importPositions: (positions) => set(s => ({ positions: [...s.positions, ...positions] })),
    }),
    { name: 'jarvis-portfolio' }
  )
)

// ─── Journal Store ────────────────────────────────────────────────────────────
interface JournalState {
  entries: JournalEntry[]
  add: (entry: JournalEntry) => void
  remove: (id: string) => void
  update: (id: string, patch: Partial<JournalEntry>) => void
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) => set(s => ({ entries: [entry, ...s.entries] })),
      remove: (id) => set(s => ({ entries: s.entries.filter(e => e.id !== id) })),
      update: (id, patch) => set(s => ({ entries: s.entries.map(e => e.id === id ? { ...e, ...patch } : e) })),
    }),
    { name: 'jarvis-journal' }
  )
)

// ─── Recent Analyses Store ────────────────────────────────────────────────────
interface RecentAnalysis { ticker: string; timestamp: number; verdict: string; score?: number }
interface RecentStore {
  recent: RecentAnalysis[]
  push: (item: RecentAnalysis) => void
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      recent: [],
      push: (item) => set(s => ({ recent: [item, ...s.recent.filter(r => r.ticker !== item.ticker)].slice(0, 10) })),
    }),
    { name: 'jarvis-recent' }
  )
)
