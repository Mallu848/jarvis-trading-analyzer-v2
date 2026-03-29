import { apiClient } from './client'

export async function fetchFearAndGreed(): Promise<{ value: number; label: string }> {
  const { data } = await apiClient.get('/fng')
  return data
}

export async function fetchMarketOverview() {
  const { data } = await apiClient.get('/market-overview')
  return data
}

export async function fetchCrypto(coinId: string, days = 90) {
  const { data } = await apiClient.get(`/crypto/${coinId}?days=${days}`)
  return data
}
