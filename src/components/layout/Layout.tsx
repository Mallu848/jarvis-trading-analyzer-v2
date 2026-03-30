import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {/* Mobile header */}
        <div className="mobile-header" style={{
          display: 'none', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderBottom: '1px solid #1e1e2e',
          backgroundColor: '#12121a', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#f1f5f9', padding: 4, display: 'flex', alignItems: 'center',
            }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '0.05em' }}>JARVIS V2</div>
        </div>

        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-overlay { display: block !important; }
          .mobile-header  { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
