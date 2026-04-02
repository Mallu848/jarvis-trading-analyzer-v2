import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Card, { CardHeader } from '../components/ui/Card'
import { blackScholes } from '../lib/blackScholes'

// Fixed sensible defaults — user doesn't need to know about these
const DEFAULT_IV = 0.28  // 28% implied volatility (reasonable baseline)
const DEFAULT_RFR = 0.045  // 4.5% risk-free rate

function buildPnlData(sp: number, strike: number, optType: 'call' | 'put', premium: number) {
  const low = sp * 0.7
  const high = sp * 1.3
  const steps = 40
  return Array.from({ length: steps + 1 }).map((_, i) => {
    const price = low + (i / steps) * (high - low)
    const payoff = optType === 'call'
      ? Math.max(price - strike, 0) - premium
      : Math.max(strike - price, 0) - premium
    return { price: parseFloat(price.toFixed(2)), pnl: parseFloat((payoff * 100).toFixed(2)) }
  })
}

function getCallout(
  optType: 'call' | 'put',
  sp: number,
  strike: number,
  dte: number,
  prob: number,
  premium: number,
): { badge: string; badgeColor: string; summary: string } {
  const contractCost = premium * 100
  const breakeven = optType === 'call' ? strike + premium : strike - premium
  const inTheMoney = optType === 'call' ? sp >= strike : sp <= strike

  let badge: string
  let badgeColor: string
  if (prob >= 0.60) { badge = 'Good Odds'; badgeColor = '#22c55e' }
  else if (prob >= 0.42) { badge = 'Coin Flip'; badgeColor = '#f59e0b' }
  else { badge = 'Long Shot'; badgeColor = '#ef4444' }

  const direction = optType === 'call' ? 'above' : 'below'
  const moveWord = optType === 'call' ? 'rise' : 'drop'

  let summary = `This ${optType} costs about $${contractCost.toFixed(0)} per contract (covers 100 shares). `
  summary += `To profit, the stock needs to be ${direction} $${breakeven.toFixed(2)} at expiration. `

  if (!inTheMoney) {
    const gap = optType === 'call' ? strike - sp : sp - strike
    summary += `The stock still needs to ${moveWord} $${gap.toFixed(2)} just to reach your strike price of $${strike.toFixed(2)}. `
  } else {
    summary += `The stock is already past your strike — it's "in the money" right now, which is a good start. `
  }

  if (dte <= 7) {
    summary += `⚠️ Warning: Only ${dte} day${dte === 1 ? '' : 's'} left. Options lose value extremely fast this close to expiry — very risky.`
  } else if (dte <= 14) {
    summary += `⚠️ Under 2 weeks left — time decay will be working against you quickly.`
  }

  return { badge, badgeColor, summary }
}

export default function OptionsAnalyzer() {
  const [optType, setOptType] = useState<'call' | 'put'>('call')
  const [spStr, setSpStr] = useState('100')
  const [strikeStr, setStrikeStr] = useState('105')
  const [dteStr, setDteStr] = useState('45')

  const sp = parseFloat(spStr) || 0
  const strike = parseFloat(strikeStr) || 0
  const dte = parseInt(dteStr) || 0
  const hasInputs = sp > 0 && strike > 0 && dte > 0

  const bsResult = blackScholes({
    stockPrice: sp || 1,
    strikePrice: strike || 1,
    daysToExpiration: dte || 1,
    impliedVolatility: DEFAULT_IV,
    riskFreeRate: DEFAULT_RFR,
    optionType: optType,
  })

  const pnlData = hasInputs ? buildPnlData(sp, strike, optType, bsResult.price) : []
  const callout = hasInputs ? getCallout(optType, sp, strike, dte, bsResult.probabilityOfProfit, bsResult.price) : null

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '10px 12px', fontSize: 15, color: '#f1f5f9', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Options Calculator</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          Enter what you know — we'll tell you if it's worth it
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        {/* Direction toggle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
            I think the stock will...
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setOptType('call')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                background: optType === 'call' ? '#22c55e' : '#1a1a2e',
                color: optType === 'call' ? '#fff' : '#475569',
                transition: 'background 0.15s',
              }}
            >
              GO UP (Call)
            </button>
            <button
              onClick={() => setOptType('put')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                background: optType === 'put' ? '#ef4444' : '#1a1a2e',
                color: optType === 'put' ? '#fff' : '#475569',
                transition: 'background 0.15s',
              }}
            >
              GO DOWN (Put)
            </button>
          </div>
        </div>

        {/* 3 inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Current Stock Price ($)
            </label>
            <input
              type="number"
              value={spStr}
              onChange={e => setSpStr(e.target.value)}
              placeholder="e.g. 150"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Strike Price ($){' '}
              <span style={{ color: '#3b82f6', fontSize: 10 }}>the price you're targeting</span>
            </label>
            <input
              type="number"
              value={strikeStr}
              onChange={e => setStrikeStr(e.target.value)}
              placeholder="e.g. 160"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Days Until Expiry
            </label>
            <input
              type="number"
              value={dteStr}
              onChange={e => setDteStr(e.target.value)}
              placeholder="e.g. 30"
              style={inputStyle}
            />
          </div>
        </div>
      </Card>

      {callout && hasInputs && (
        <>
          {/* Plain English Verdict */}
          <Card style={{ marginBottom: 20, border: `1px solid ${callout.badgeColor}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                background: `${callout.badgeColor}20`, color: callout.badgeColor,
                fontWeight: 700, fontSize: 12, padding: '4px 14px', borderRadius: 20,
                border: `1px solid ${callout.badgeColor}50`,
              }}>
                {callout.badge}
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0, lineHeight: 1.75 }}>
              {callout.summary}
            </p>
          </Card>

          {/* Key Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              {
                label: 'Estimated Cost',
                sub: 'per contract · covers 100 shares',
                value: `$${(bsResult.price * 100).toFixed(2)}`,
                color: '#3b82f6',
              },
              {
                label: 'Breakeven Price',
                sub: optType === 'call' ? 'stock must close above this' : 'stock must close below this',
                value: `$${bsResult.breakeven.toFixed(2)}`,
                color: '#f59e0b',
              },
              {
                label: 'Profit Chance',
                sub: 'estimated odds of this working',
                value: `${(bsResult.probabilityOfProfit * 100).toFixed(0)}%`,
                color: bsResult.probabilityOfProfit >= 0.5 ? '#22c55e' : '#ef4444',
              },
            ].map(({ label, sub, value, color }) => (
              <div key={label} style={{
                background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, padding: '16px',
              }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                  {value}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* P&L Chart */}
          <Card>
            <CardHeader
              title="Profit & Loss at Expiration"
              subtitle="Shows how much you'd make or lose depending on where the stock ends up"
            />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pnlData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="price" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'Profit / Loss']}
                  labelFormatter={l => `If stock is at $${l}`}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine x={sp} stroke="#3b82f6" strokeDasharray="4 4" />
                <Line
                  type="monotone" dataKey="pnl"
                  stroke={optType === 'call' ? '#22c55e' : '#ef4444'}
                  dot={false} strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8, textAlign: 'center' }}>
              Blue dashed = current stock price &nbsp;|&nbsp; {optType === 'call' ? 'Green' : 'Red'} line = your profit or loss per contract
            </div>
          </Card>
        </>
      )}

      {!hasInputs && (
        <div style={{
          textAlign: 'center', padding: '48px 0', color: '#475569', fontSize: 14,
        }}>
          Fill in the three fields above to see your analysis
        </div>
      )}
    </div>
  )
}
