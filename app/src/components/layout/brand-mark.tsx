/**
 * Temp Platform brand mark: a COG-style cog/gear with a skull at its center
 * (Gears homage) + the wordmark. The gear slowly rotates on hover.
 */
export function CogSkull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gear teeth ring */}
      <g className="origin-center transition-transform duration-700 group-hover/brand:rotate-45">
        <path
          d="M24 2l3.2 4.3 5.2-1.9 1.1 5.4 5.5.4-1.2 5.4 4.6 3-3.2 4.5 3.2 4.5-4.6 3 1.2 5.4-5.5.4-1.1 5.4-5.2-1.9L24 46l-3.2-4.3-5.2 1.9-1.1-5.4-5.5-.4 1.2-5.4-4.6-3 3.2-4.5-3.2-4.5 4.6-3-1.2-5.4 5.5-.4 1.1-5.4 5.2 1.9L24 2z"
          fill="hsl(var(--tc-accent))"
          opacity="0.9"
        />
        <circle cx="24" cy="24" r="13" fill="hsl(var(--tc-canvas))" />
      </g>
      {/* Skull */}
      <g fill="hsl(var(--tc-fg))">
        <path d="M24 13c-5 0-8.5 3.4-8.5 8 0 2.6 1.2 4.4 2.6 5.6.5.4.8 1 .8 1.7v1.4c0 .8.6 1.4 1.4 1.4h1.1v-2.3h1.4v2.3h2.4v-2.3h1.4v2.3h1.1c.8 0 1.4-.6 1.4-1.4v-1.4c0-.7.3-1.3.8-1.7 1.4-1.2 2.6-3 2.6-5.6 0-4.6-3.5-8-8.5-8z" />
        <circle cx="20.3" cy="21.5" r="2.2" fill="hsl(var(--tc-canvas))" />
        <circle cx="27.7" cy="21.5" r="2.2" fill="hsl(var(--tc-canvas))" />
      </g>
    </svg>
  );
}

export function BrandMark() {
  return (
    <div className="group/brand flex items-center gap-2.5">
      <CogSkull className="h-7 w-7 shrink-0 drop-shadow-[0_0_6px_hsl(var(--tc-accent)/0.5)]" />
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-tc-fg">
        Temp Platform
      </span>
    </div>
  );
}
