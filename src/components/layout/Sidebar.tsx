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
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#080d14', border: '1px solid rgba(34,197,94,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(34,197,94,0.4), 0 0 6px rgba(74,222,128,0.2), inset 0 0 10px rgba(34,197,94,0.08)' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {/* Candle 1 — left, short */}
              <line x1="5" y1="14.5" x2="5" y2="16.5" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              <rect x="3.25" y="16.5" width="3.5" height="4" rx="0.5" fill="#22c55e"/>
              <line x1="5" y1="20.5" x2="5" y2="22" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              {/* Candle 2 — center, medium */}
              <line x1="11" y1="9.5" x2="11" y2="11.5" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              <rect x="9.25" y="11.5" width="3.5" height="6" rx="0.5" fill="#22c55e"/>
              <line x1="11" y1="17.5" x2="11" y2="19.5" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              {/* Candle 3 — right, tallest */}
              <line x1="17" y1="3.5" x2="17" y2="5.5" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              <rect x="15.25" y="5.5" width="3.5" height="8" rx="0.5" fill="#22c55e"/>
              <line x1="17" y1="13.5" x2="17" y2="16" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
              {/* Rising trend line through tops */}
              <polyline points="5,16.5 11,11.5 17,5.5" stroke="#4ade80" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="1.8 1.2" opacity="0.8"/>
              {/* Arrowhead */}
              <path d="M15,7 L17,3.5 L19,7" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
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
