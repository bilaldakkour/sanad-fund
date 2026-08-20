import { Skeleton } from "@/components/Skeleton";

export default function LedgerLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
