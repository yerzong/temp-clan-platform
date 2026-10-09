import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * A clickable module summary tile for the Overview dashboard: icon + a headline
 * metric + label, linking to the module. Generic and reusable.
 */
export function SummaryCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "accent";
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-tc-border bg-card p-4 transition-colors hover:border-tc-border-strong hover:bg-tc-surface-1"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-0.5 ${
          tone === "accent"
            ? "bg-[hsl(var(--tc-accent))]"
            : "bg-tc-border-strong opacity-0 transition-opacity group-hover:opacity-100"
        }`}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-tc-fg-muted">
          {label}
        </span>
        <Icon className="h-4 w-4 text-tc-fg-muted transition-colors group-hover:text-tc-fg-tertiary" />
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-mono text-3xl font-semibold tabular-nums leading-none ${
            tone === "accent"
              ? "text-[hsl(var(--tc-accent-hover))]"
              : "text-tc-fg"
          }`}
        >
          {value}
        </span>
      </div>
      {hint && <span className="text-[11px] text-tc-fg-tertiary">{hint}</span>}
    </Link>
  );
}
