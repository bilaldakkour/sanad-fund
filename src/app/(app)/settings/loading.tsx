import { Skeleton } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
