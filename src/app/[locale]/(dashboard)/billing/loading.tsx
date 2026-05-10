import { SkeletonCard, SkeletonText } from "@/components/ui/SkeletonLoader";
export default function Loading() {
  return (
    <div>
      <SkeletonText width={260} height={32} />
      <SkeletonText width={360} height={16} />
      <div style={{ height: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
        <SkeletonCard height={360} />
        <SkeletonCard height={360} />
        <SkeletonCard height={360} />
      </div>
      <SkeletonText width={280} height={20} />
      <div style={{ height: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
      </div>
    </div>
  );
}
