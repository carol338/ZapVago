import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-40" />
      <Skeleton className="mb-3 h-9 w-full sm:w-56" />
      <div className="flex h-[calc(100dvh-13rem)] overflow-hidden rounded-xl border border-surface-border bg-surface md:h-[70vh]">
        <div className="hidden w-80 shrink-0 space-y-3 border-r border-surface-border p-3 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
    </div>
  );
}
