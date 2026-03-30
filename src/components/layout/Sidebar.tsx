import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BarChart2, Search,
  Bell, Briefcase, Bitcoin, BookOpen, Settings, X,
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()

  const handleNav = (to: string) => {
    navigate(to)
    onClose()
  }

  return (
    <>
      <aside style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: '#12121a',
        borderRight: '1px solid #1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
        className="sidebar-desktop"
      >
        <SidebarContents onClose={onClose} />
      </aside>

      {/* Mobile drawer */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 240,
        backgroundColor: '#12121a',
        borderRight: '1px solid #1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
        className="sidebar-mobile"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', padding: 4, display: 'flex', alignItems: 'center',
          }}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        <SidebarContents onClose={onClose} mobile />
      </aside>

      <style>{`
        @media (min-width: 769px) {
          .sidebar-mobile  { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </>
  )
}

function SidebarContents({ onClose, mobile = false }: { onClose: () => void; mobile?: boolean }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: mobile ? '20px 16px 16px 16px' : '20px 16px 16px', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #5b21b6, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(139,92,246,0.55)' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {/* Candlestick 1 */}
              <line x1="4" y1="11.5" x2="4" y2="14" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              <rect x="2.5" y="14" width="3" height="5.5" rx="0.6" fill="white" fillOpacity="0.9"/>
              <line x1="4" y1="19.5" x2="4" y2="21" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              {/* Candlestick 2 */}
              <line x1="11" y1="8" x2="11" y2="10.5" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              <rect x="9.5" y="10.5" width="3" height="7" rx="0.6" fill="white" fillOpacity="0.9"/>
              <line x1="11" y1="17.5" x2="11" y2="19" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              {/* Candlestick 3 */}
              <line x1="18" y1="3.5" x2="18" y2="6" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              <rect x="16.5" y="6" width="3" height="9" rx="0.6" fill="white" fillOpacity="0.9"/>
              <line x1="18" y1="15" x2="18" y2="16.5" stroke="white" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round"/>
              {/* Trend line + arrow */}
              <polyline points="4,15.5 11,12 18,8" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <polyline points="15.5,6.5 18,8 20.5,6.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
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
            onClick={onClose}
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
    </>
  )
}
