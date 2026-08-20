import { Skeleton } from "@/components/Skeleton";

export default function ApprovalsLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40 rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
