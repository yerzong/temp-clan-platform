/**
 * "EN VIVO" chip — a small live indicator with a pulsing dot in a soft halo.
 * Reused across member/player lists and the profile modal.
 */
export function LiveChip({ className = "" }: { className?: string }) {
  return (
    <span
      title="En vivo"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[hsl(var(--tc-destructive))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_10px_-2px_hsl(var(--tc-destructive))] ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      En vivo
    </span>
  );
}
