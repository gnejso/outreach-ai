import { SkeletonCard, SkeletonText } from "@/components/ui/SkeletonLoader";
export default function Loading() {
  return (
    <div>
      <SkeletonText width={240} height={32} />
      <SkeletonText width={340} height={16} />
      <div style={{ height: 24 }} />
      <SkeletonCard height={180} />
      <div style={{ height: 16 }} />
      <SkeletonCard height={400} />
    </div>
  );
}
