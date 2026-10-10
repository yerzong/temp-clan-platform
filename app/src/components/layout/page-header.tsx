import type { ReactNode } from "react";

/**
 * Standard page header used across modules: a mono eyebrow label, a strong
 * title, optional subtitle, and an optional actions/stats slot on the right.
 * Unifies the look of every module screen.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="tc-animate-in mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-tc-border-soft pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--tc-accent-hover))]">
          <span className="h-1 w-4 rounded-full bg-[hsl(var(--tc-accent))] shadow-[0_0_6px_hsl(var(--tc-accent))]" />
          {eyebrow}
        </span>
        <h1 className="text-[2rem] font-semibold leading-none tracking-tight text-tc-fg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-tc-fg-tertiary">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
