import { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  hover?: boolean
  padding?: number | string
}

export default function Card({ children, style, hover = false, padding = 16 }: CardProps) {
  return (
    <div
      className={hover ? 'card-hover' : ''}
      style={{
        backgroundColor: '#12121a',
        border: '1px solid #1e1e2e',
        borderRadius: 8,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', letterSpacing: '0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
