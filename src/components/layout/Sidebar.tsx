import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BarChart2, Search,
  Bell, Briefcase, Bitcoin, BookOpen, Settings,
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/analyze',   icon: TrendingUp,      label: 'Analyzer'    },
  { to: '/options',   icon: BarChart2,        label: 'Options'     },
  { to: '/screener',  icon: Search,           label: 'Screener'    },
  { to: '/alerts',    icon: Bell,             label: 'Alerts'      },
  { to: '/portfolio', icon: Briefcase,        label: 'Portfolio'   },
  { to: '/crypto',    icon: Bitcoin,          label: 'Crypto'      },
  { to: '/journal',   icon: BookOpen,         label: 'Journal'     },
  { to: '/settings',  icon: Settings,         label: 'Settings'    },
]

export default function Sidebar() {
  return (
    <aside style={{ width: 220, minHeight: '100vh', backgroundColor: '#12121a', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '0.05em' }}>JARVIS</div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em' }}>V2 TRADING</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 6,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#f1f5f9' : '#64748b',
              backgroundColor: isActive ? '#1e1e2e' : 'transparent',
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.backgroundColor.includes('1e1e2e')) {
                el.style.color = '#f1f5f9'
                el.style.backgroundColor = '#ffffff08'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.backgroundColor.includes('1e1e2e')) {
                el.style.color = '#64748b'
                el.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', fontSize: 10, color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
          Data: Yahoo Finance · CoinGecko
        </div>
      </div>
    </aside>
  )
}
