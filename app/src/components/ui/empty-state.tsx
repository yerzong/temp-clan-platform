import type { ReactNode } from "react";

/**
 * A tactical empty state: a dashed "deployment zone" panel with a short brief.
 * Generic and reusable — gives empty modules presence instead of flat text.
 */
export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-tc-border-strong bg-[hsl(var(--tc-canvas))] px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-tc-border bg-tc-surface-2 text-tc-fg-tertiary">
        {icon ?? <span className="font-mono text-sm">//</span>}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-tc-fg-secondary">{title}</p>
        {description && (
          <p className="max-w-xs text-sm text-tc-fg-tertiary">{description}</p>
        )}
      </div>
    </div>
  );
}
