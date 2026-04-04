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
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2dfd8',
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
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2dfd8',
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
      <div style={{ padding: mobile ? '20px 16px 16px 16px' : '20px 16px 16px', borderBottom: '1px solid #e2dfd8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: '#030a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.55), 0 0 14px rgba(59,130,246,0.4), 0 0 28px rgba(59,130,246,0.12)',
          }}>
            <span style={{
              fontWeight: 800, fontSize: 22, color: '#3b82f6',
              fontFamily: 'Georgia, serif', lineHeight: 1,
              textShadow: '0 0 8px rgba(59,130,246,0.6)',
            }}>R</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', letterSpacing: '0.05em' }}>JARVIS</div>
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
              color: isActive ? '#1a1a2e' : '#64748b',
              backgroundColor: isActive ? '#e2dfd8' : 'transparent',
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.backgroundColor.includes('dde2e8')) {
                el.style.color = '#1a1a2e'
                el.style.backgroundColor = '#00000008'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.backgroundColor.includes('dde2e8')) {
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2dfd8', fontSize: 10, color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
          Data: Yahoo Finance · CoinGecko
        </div>
      </div>
    </>
  )
}
