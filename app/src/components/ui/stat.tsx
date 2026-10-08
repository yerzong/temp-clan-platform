import { cn } from "@/lib/utils";

/**
 * A labelled metric readout. Generic and reusable. The optional `accent` makes
 * a value stand out when it signals something that needs attention (command
 * center feel) — color carries meaning, it is not decoration.
 */
export function Stat({
  label,
  value,
  align = "end",
  accent = false,
}: {
  label: string;
  value: string | number;
  align?: "start" | "end";
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "end" ? "items-end" : "items-start"
      )}
    >
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums leading-none",
          accent ? "text-[hsl(var(--tc-accent-hover))]" : "text-tc-fg"
        )}
      >
        {value}
      </span>
      <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-tc-fg-muted">
        {label}
      </span>
    </div>
  );
}

/**
 * A metric presented as a command-panel tile: a bordered surface with a thin
 * accent edge. Use for dashboard header KPIs.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-tc-border bg-card px-4 py-3">
      {/* thin accent edge */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-0.5",
          tone === "accent"
            ? "bg-[hsl(var(--tc-accent))]"
            : "bg-tc-border-strong"
        )}
      />
      <div className="flex flex-col gap-1 pl-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-tc-fg-muted">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-3xl font-semibold tabular-nums leading-none",
            tone === "accent"
              ? "text-[hsl(var(--tc-accent-hover))]"
              : "text-tc-fg"
          )}
        >
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-tc-fg-tertiary">{hint}</span>
        )}
      </div>
    </div>
  );
}
