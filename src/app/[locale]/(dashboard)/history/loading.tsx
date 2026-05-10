import { SkeletonCard, SkeletonText, TableSkeleton } from "@/components/ui/SkeletonLoader";
export default function Loading() {
  return (
    <div>
      <SkeletonText width={220} height={32} />
      <div style={{ height: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
