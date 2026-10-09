import { cn } from "@/lib/utils";

/** A shimmering placeholder block used while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-tc-surface-2",
        className
      )}
    />
  );
}
