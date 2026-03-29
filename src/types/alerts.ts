export type AlertCondition =
  | 'price-above'
  | 'price-below'
  | 'pct-change-above'
  | 'pct-change-below'
  | 'rsi-above'
  | 'rsi-below'

export type AlertStatus = 'active' | 'triggered' | 'paused'

export interface PriceAlert {
  id: string
  ticker: string
  condition: AlertCondition
  targetValue: number
  status: AlertStatus
  createdAt: string
  triggeredAt?: string
  triggerPrice?: number
  note?: string
  lastChecked?: string
  currentValue?: number
}

export interface AlertHistoryEntry {
  id: string
  alertId: string
  ticker: string
  condition: AlertCondition
  targetValue: number
  triggerPrice: number
  triggeredAt: string
  tradeTaken?: boolean
  tradeOutcome?: string
}
