/** The Temp Platform brand mark: live-status dot + wordmark. Reusable. */
export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2 w-2 rounded-full bg-tc-accent shadow-[0_0_8px_hsl(var(--tc-accent))]" />
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-tc-fg-tertiary">
        Temp Platform
      </span>
    </div>
  );
}
