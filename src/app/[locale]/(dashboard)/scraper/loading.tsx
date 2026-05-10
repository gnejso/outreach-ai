import { SkeletonCard, SkeletonText } from "@/components/ui/SkeletonLoader";
export default function Loading() {
  return (
    <div>
      <SkeletonText width={200} height={32} />
      <SkeletonText width={320} height={16} />
      <div style={{ height: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 600 }}>
        <SkeletonCard height={120} />
        <SkeletonCard height={120} />
      </div>
      <div style={{ height: 24 }} />
      <SkeletonCard height={300} />
    </div>
  );
}
