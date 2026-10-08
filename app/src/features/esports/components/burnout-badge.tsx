import type { BurnoutSignal } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  BurnoutSignal,
  { label: string; className: string }
> = {
  ok: {
    label: "Healthy",
    className:
      "bg-[hsl(var(--tc-success)/0.14)] text-[hsl(var(--tc-success))] border-[hsl(var(--tc-success)/0.3)]",
  },
  watch: {
    label: "Watch",
    className:
      "bg-[hsl(var(--tc-amber)/0.12)] text-[hsl(var(--tc-amber))] border-[hsl(var(--tc-amber)/0.3)]",
  },
  elevated: {
    label: "Check in",
    className:
      "bg-[hsl(var(--tc-accent)/0.14)] text-[hsl(var(--tc-accent-hover))] border-[hsl(var(--tc-accent)/0.3)]",
  },
  unknown: {
    label: "No data",
    className: "bg-tc-surface-3 text-tc-fg-muted border-tc-border",
  },
};

/**
 * Burnout SIGNAL badge. This is a prompt to check in with the person, NOT a
 * medical diagnosis. Labels are intentionally supportive ("Check in"), not
 * clinical.
 */
export function BurnoutBadge({ signal }: { signal: BurnoutSignal }) {
  const cfg = CONFIG[signal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        cfg.className
      )}
      title="Self-reported signal — a prompt to check in, not a diagnosis"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
