import { SkeletonCard, SkeletonText } from "@/components/ui/SkeletonLoader";
export default function Loading() {
  return (
    <div>
      <SkeletonText width={200} height={32} />
      <SkeletonText width={300} height={16} />
      <div style={{ height: 24 }} />
      {[1,2,3].map(i => (
        <div key={i} style={{ marginBottom: 12 }}>
          <SkeletonCard height={100} />
        </div>
      ))}
    </div>
  );
}
