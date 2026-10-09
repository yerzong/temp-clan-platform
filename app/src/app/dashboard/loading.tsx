import { Skeleton } from "@/components/ui/skeleton";

/** Shown automatically while a dashboard page loads its data. */
export default function DashboardLoading() {
  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-tc-border-soft pb-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[72px]" />
        </div>
      </div>

      {/* Content area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
