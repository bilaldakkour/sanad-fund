import { Skeleton } from "@/components/Skeleton";

export default function HandoverLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 rounded" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-28 rounded-3xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
