export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(90deg, #0C1628 0%, #132240 50%, #0C1628 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        border: "1px solid var(--border)",
      }}
    />
  );
}

export function SkeletonText({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background: "linear-gradient(90deg, #0C1628 0%, #132240 50%, #0C1628 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        marginBottom: 8,
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <SkeletonText width={280} height={32} />
      <SkeletonText width={200} height={16} />
      <div style={{ height: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <SkeletonCard height={110} />
        <SkeletonCard height={110} />
        <SkeletonCard height={110} />
      </div>
      <SkeletonText width={160} height={20} />
      <div style={{ height: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        <SkeletonCard height={90} />
        <SkeletonCard height={90} />
        <SkeletonCard height={90} />
      </div>
      <SkeletonText width={180} height={20} />
      <div style={{ height: 12 }} />
      <SkeletonCard height={300} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <SkeletonText width="30%" height={12} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: "16px 20px", borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none", display: "flex", gap: 16 }}>
          <SkeletonText width="25%" height={13} />
          <SkeletonText width="35%" height={13} />
          <SkeletonText width="20%" height={13} />
        </div>
      ))}
    </div>
  );
}
