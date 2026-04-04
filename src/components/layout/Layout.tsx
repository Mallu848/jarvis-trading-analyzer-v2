import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f4f0' }}>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
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
          padding: '12px 16px', borderBottom: '1px solid #e2dfd8',
          backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#1a1a2e', padding: 4, display: 'flex', alignItems: 'center',
            }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#040e1c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(59,130,246,0.55), 0 0 10px rgba(59,130,246,0.35)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5,9 L5,5 L9,5" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15,5 L19,5 L19,9" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19,15 L19,19 L15,19" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9,19 L5,19 L5,15" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#3b82f6" strokeWidth="0.8" fill="none" opacity="0.45"/>
                <circle cx="12" cy="12" r="1.6" fill="#3b82f6"/>
                <circle cx="12" cy="12" r="0.7" fill="#93c5fd"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', letterSpacing: '0.05em' }}>JARVIS</div>
          </div>
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
