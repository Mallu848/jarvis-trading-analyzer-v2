import { useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, Bell, Database, Info } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import { useSettingsStore, useWatchlistStore } from '../store/index'

export default function Settings() {
  const settings = useSettingsStore()
  const watchlist = useWatchlistStore()

  const [accountSize, setAccountSize] = useState(settings.accountSize)
  const [riskPct, setRiskPct] = useState(settings.riskPct)
  const [watchlistText, setWatchlistText] = useState(settings.defaultWatchlist.join(', '))
  const [notifEnabled, setNotifEnabled] = useState(settings.notificationsEnabled)

  function saveAccount() {
    settings.setAccountSize(accountSize)
    settings.setRiskPct(riskPct)
    toast.success('Account settings saved')
  }

  function applyWatchlist() {
    const tickers = watchlistText
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean)
    settings.setDefaultWatchlist(tickers)
    // Overwrite watchlist store
    tickers.forEach(t => watchlist.add(t))
    toast.success(`Watchlist updated — ${tickers.length} tickers`)
  }

  function requestPermission() {
    if (!('Notification' in window)) {
      toast.error('Browser does not support notifications')
      return
    }
    Notification.requestPermission().then(result => {
      if (result === 'granted') {
        settings.setNotifications(true)
        setNotifEnabled(true)
        toast.success('Notifications enabled')
      } else {
        settings.setNotifications(false)
        setNotifEnabled(false)
        toast.error('Permission not granted')
      }
    })
  }

  function clearAllData() {
    if (!window.confirm('This will clear ALL JARVIS data (watchlist, portfolio, journal, alerts, settings). Are you sure?')) return
    localStorage.clear()
    toast.success('All data cleared — reloading…')
    setTimeout(() => window.location.reload(), 1200)
  }

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 6,
    padding: '9px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 720 }}>
      <div style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Settings</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Configure JARVIS V2 to your preferences</div>
      </div>

      {/* Account Settings */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Account Settings" subtitle="Used for position sizing calculations" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Account Size ($)
            </label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(Number(e.target.value))}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
              Total capital available for trading
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Risk % per Trade
            </label>
            <input
              type="number"
              value={riskPct}
              step={0.5}
              min={0.5}
              max={10}
              onChange={e => setRiskPct(Number(e.target.value))}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
              Max % of account to risk on a single trade. 1–2% is standard.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={saveAccount}
            style={{
              background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 20px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            Save
          </button>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Max risk per trade: <strong style={{ color: '#f1f5f9' }}>
              ${(accountSize * riskPct / 100).toFixed(2)}
            </strong>
          </div>
        </div>
      </Card>

      {/* Default Watchlist */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Default Watchlist" subtitle="Pre-populate your watchlist" />
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
            Tickers (comma-separated)
          </label>
          <textarea
            value={watchlistText}
            onChange={e => setWatchlistText(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            placeholder="TSLA, AAPL, NVDA, SPY, QQQ"
          />
        </div>
        <button
          onClick={applyWatchlist}
          style={{
            background: '#22c55e18', border: '1px solid #22c55e30', borderRadius: 6, padding: '7px 18px',
            cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 600,
          }}
        >
          Apply Watchlist
        </button>
      </Card>

      {/* Notifications */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Notifications" action={<Bell size={14} color="#64748b" />} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>Browser Notifications</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Receive alerts when price conditions are triggered
            </div>
          </div>
          <button
            onClick={() => {
              const next = !notifEnabled
              settings.setNotifications(next)
              setNotifEnabled(next)
              toast(next ? 'Notifications enabled' : 'Notifications disabled')
            }}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: notifEnabled ? '#22c55e' : '#1e1e2e',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 4, left: notifEnabled ? 24 : 4,
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
        <button
          onClick={requestPermission}
          style={{
            background: '#3b82f618', border: '1px solid #3b82f630', borderRadius: 6, padding: '7px 16px',
            cursor: 'pointer', color: '#3b82f6', fontSize: 12, fontWeight: 600,
          }}
        >
          Request Browser Permission
        </button>
      </Card>

      {/* About */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="About JARVIS V2" action={<Info size={14} color="#64748b" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #1e1e2e' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Version</span>
            <span style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>2.0.0</span>
          </div>
          <div style={{ paddingBottom: 10, borderBottom: '1px solid #1e1e2e' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Data Sources</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Yahoo Finance', 'CoinGecko', 'Alternative.me (Fear & Greed)'].map(s => (
                <span key={s} style={{
                  background: '#1a1a2e', border: '1px solid #1e1e2e', borderRadius: 4,
                  padding: '3px 8px', fontSize: 11, color: '#64748b',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div style={{
            background: '#f59e0b10', border: '1px solid #f59e0b20', borderRadius: 6,
            padding: '10px 12px', fontSize: 11, color: '#f59e0b', lineHeight: 1.6,
          }}>
            <Shield size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            <strong>Disclaimer:</strong> JARVIS V2 is for educational purposes only. Nothing here constitutes financial advice.
            Always do your own research and consult a licensed financial advisor before making trading decisions.
            Past analysis does not guarantee future performance.
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card style={{ border: '1px solid #ef444420' }}>
        <CardHeader title="Danger Zone" action={<Database size={14} color="#ef4444" />} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>Clear All Data</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Permanently deletes all watchlist, portfolio, journal, alert, and settings data from localStorage.
            </div>
          </div>
          <button
            onClick={clearAllData}
            style={{
              background: '#ef444418', border: '1px solid #ef444430', borderRadius: 6, padding: '8px 16px',
              cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 16,
            }}
          >
            Clear All Data
          </button>
        </div>
      </Card>
    </div>
  )
}
