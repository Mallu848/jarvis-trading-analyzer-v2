import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Bell, BellOff, Trash2, Pause, Play } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useAlertsStore } from '../store/index'
import { sanitizeTicker, sanitizeNote } from '../utils/sanitize'
import type { AlertCondition, AlertStatus } from '../types/alerts'

const CONDITION_LABELS: Record<AlertCondition, string> = {
  'price-above': 'Price Above',
  'price-below': 'Price Below',
  'pct-change-above': '% Change Above',
  'pct-change-below': '% Change Below',
  'rsi-above': 'RSI Above',
  'rsi-below': 'RSI Below',
}

const STATUS_VARIANTS: Record<AlertStatus, 'blue' | 'green' | 'amber'> = {
  active: 'blue',
  triggered: 'green',
  paused: 'amber',
}

const EMPTY_FORM = {
  ticker: '',
  condition: 'price-above' as AlertCondition,
  targetValue: '',
  note: '',
}

export default function Alerts() {
  const store = useAlertsStore()
  const [form, setForm] = useState(EMPTY_FORM)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const target = parseFloat(form.targetValue)
    if (!form.ticker.trim() || isNaN(target)) {
      toast.error('Ticker and target value are required')
      return
    }
    store.add({
      id: crypto.randomUUID(),
      ticker: form.ticker.trim().toUpperCase(),
      condition: form.condition,
      targetValue: target,
      status: 'active',
      createdAt: new Date().toISOString(),
      note: form.note || undefined,
    })
    setForm(EMPTY_FORM)
    toast.success('Alert created')
  }

  function handleTogglePause(id: string, current: AlertStatus) {
    if (current === 'triggered') return
    store.update(id, { status: current === 'paused' ? 'active' : 'paused' })
  }

  function requestPermission() {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications')
      return
    }
    Notification.requestPermission().then(result => {
      if (result === 'granted') {
        toast.success('Notification permission granted')
      } else if (result === 'denied') {
        toast.error('Notification permission denied')
      } else {
        toast('Permission request dismissed', { icon: '🔕' })
      }
    })
  }

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '8px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Price Alerts</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Set price and condition alerts for any ticker</div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#3b82f610', border: '1px solid #3b82f620', borderRadius: 8,
        padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} color="#3b82f6" />
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Alerts check every 60 seconds when the app is open. Browser notifications require permission.
          </span>
        </div>
        <button
          onClick={requestPermission}
          style={{
            background: '#3b82f618', border: '1px solid #3b82f630', borderRadius: 6, padding: '5px 12px',
            cursor: 'pointer', color: '#3b82f6', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          Request Permission
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start', marginBottom: 20 }}>
        {/* Create Alert Form */}
        <Card>
          <CardHeader title="Create Alert" />
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Ticker *</label>
                <input
                  value={form.ticker}
                  onChange={e => setForm(f => ({ ...f, ticker: sanitizeTicker(e.target.value) }))}
                  placeholder="TSLA"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Condition *</label>
                <select
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value as AlertCondition }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {(Object.keys(CONDITION_LABELS) as AlertCondition[]).map(c => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Target Value *</label>
                <input
                  type="number"
                  step="any"
                  value={form.targetValue}
                  onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                  placeholder="200.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Note (optional)</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: sanitizeNote(e.target.value) }))}
                  placeholder="Reason for alert…"
                  style={inputStyle}
                />
              </div>
            </div>
            <button type="submit" style={{
              background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 20px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              Create Alert
            </button>
          </form>
        </Card>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Active', value: store.alerts.filter(a => a.status === 'active').length, color: '#3b82f6' },
            { label: 'Triggered', value: store.alerts.filter(a => a.status === 'triggered').length, color: '#22c55e' },
            { label: 'Paused', value: store.alerts.filter(a => a.status === 'paused').length, color: '#f59e0b' },
            { label: 'History', value: store.history.length, color: '#64748b' },
          ].map(({ label, value, color }) => (
            <Card key={label} padding={14} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Active Alerts" subtitle={`${store.alerts.length} total`} />
        {store.alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
            <BellOff size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No alerts set. Create one above.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Ticker', 'Condition', 'Target', 'Status', 'Note', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Ticker' ? 'left' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.alerts.map(alert => (
                  <tr key={alert.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{alert.ticker}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{CONDITION_LABELS[alert.condition]}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{alert.targetValue}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <Badge variant={STATUS_VARIANTS[alert.status]} size="xs">{alert.status}</Badge>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.note ?? '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: 11 }}>
                      {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {alert.status !== 'triggered' && (
                          <button
                            onClick={() => handleTogglePause(alert.id, alert.status)}
                            title={alert.status === 'paused' ? 'Resume' : 'Pause'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 3 }}
                          >
                            {alert.status === 'paused' ? <Play size={12} /> : <Pause size={12} />}
                          </button>
                        )}
                        <button
                          onClick={() => store.remove(alert.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 3 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader title="Alert History" subtitle={`${store.history.length} entries`} />
        {store.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 13 }}>
            No alerts have triggered yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Ticker', 'Condition', 'Target', 'Trigger Price', 'Triggered At'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Ticker' ? 'left' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {store.history.slice(0, 50).map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{h.ticker}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>{CONDITION_LABELS[h.condition]}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{h.targetValue}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>{h.triggerPrice.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: 11 }}>
                      {format(new Date(h.triggeredAt), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
