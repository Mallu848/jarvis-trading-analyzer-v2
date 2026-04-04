export default function Skeleton({ width = '100%', height = 16, borderRadius = 4 }: {
  width?: string | number
  height?: number
  borderRadius?: number
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, display: 'block' }}
    />
  )
}

export function SkeletonCard({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2dfd8', borderRadius: 8, padding: 16 }}>
      <Skeleton width="40%" height={14} />
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} width={`${70 + Math.random() * 30}%`} height={12} />
        ))}
      </div>
    </div>
  )
}
