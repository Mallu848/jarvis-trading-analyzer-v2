type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'muted'

const STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  green: { bg: '#22c55e18', color: '#22c55e' },
  red:   { bg: '#ef444418', color: '#ef4444' },
  amber: { bg: '#f59e0b18', color: '#f59e0b' },
  blue:  { bg: '#3b82f618', color: '#3b82f6' },
  muted: { bg: '#64748b18', color: '#64748b' },
}

export default function Badge({ children, variant = 'muted', size = 'sm' }: {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'xs' | 'sm'
}) {
  const { bg, color } = STYLES[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'xs' ? '2px 6px' : '3px 8px',
      borderRadius: 4,
      fontSize: size === 'xs' ? 10 : 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      backgroundColor: bg,
      color,
    }}>
      {children}
    </span>
  )
}
