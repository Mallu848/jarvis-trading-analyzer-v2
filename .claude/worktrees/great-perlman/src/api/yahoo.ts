import { apiClient } from './client'
import { computeTechnicals, computeTradeSetup } from '../lib/technicals'
import type { StockAnalysis, OHLCVBar, SearchResult } from '../types/market'

export async function fetchStockAnalysis(ticker: string): Promise<StockAnalysis> {
  const { data } = await apiClient.get(`/analyze/${ticker}`)
  const tech = computeTechnicals(data.dailyData, data.weeklyData)
  const tradeSetup = computeTradeSetup(data.dailyData, tech)
  const last = data.dailyData[data.dailyData.length - 1] as OHLCVBar
  const prev = data.dailyData[data.dailyData.length - 2] as OHLCVBar

  return {
    ticker: data.ticker,
    quote: {
      ticker: data.ticker,
      name: data.name ?? data.ticker,
      price: last.close,
      change: last.close - prev.close,
      changePct: ((last.close - prev.close) / prev.close) * 100,
      volume: last.volume,
      avgVolume: data.dailyData.slice(-20).reduce((s: number, b: OHLCVBar) => s + b.volume, 0) / 20,
      earningsDate: data.earningsDate,
    },
    dailyData: data.dailyData,
    weeklyData: data.weeklyData,
    technicals: tech,
    tradeSetup,
    earningsDate: data.earningsDate,
  }
}

export async function fetchQuotes(tickers: string[]): Promise<Record<string, { price: number; changePct: number }>> {
  const { data } = await apiClient.get(`/quotes?symbols=${tickers.join(',')}`)
  return data
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  const { data } = await apiClient.get(`/search?q=${encodeURIComponent(query)}`)
  return data
}

export async function fetchOptionsChain(ticker: string, expiration?: string) {
  const url = expiration ? `/options/${ticker}?expiration=${expiration}` : `/options/${ticker}`
  const { data } = await apiClient.get(url)
  return data
}
