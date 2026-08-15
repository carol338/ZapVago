import { Skeleton } from "@/components/ui/skeleton";

export default function ClientProfileLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-surface p-4">
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
