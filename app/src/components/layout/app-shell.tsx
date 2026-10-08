import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

/**
 * App shell: a fixed left sidebar (brand + nav) plus a sticky top bar (context
 * on the left, user/actions on the right) over a wide content area. The sidebar
 * and top bar share the canvas background with borders — one surface, not two
 * worlds. This is the standard dashboard frame (nav where you ARE goes left,
 * context + actions go top).
 */
export function AppShell({
  children,
  userName,
  actions,
  nav,
  topLeft,
}: {
  children: ReactNode;
  userName?: string;
  actions?: ReactNode;
  nav?: ReactNode;
  topLeft?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen md:grid md:grid-cols-[232px_1fr]">
      {/* Subtle tactical grid texture across the whole app */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--tc-fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--tc-fg)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Sidebar: brand + nav only */}
      <aside className="relative z-10 flex flex-col gap-6 border-b border-tc-border-soft bg-[hsl(var(--tc-canvas))] px-4 py-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="px-2">
          <BrandMark />
        </div>
        <div className="flex-1">{nav}</div>
      </aside>

      {/* Right column: top bar + content */}
      <div className="relative z-0 flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-tc-border-soft bg-[hsl(var(--tc-canvas)/0.85)] px-6 py-3.5 backdrop-blur lg:px-10">
          <div className="min-w-0">{topLeft}</div>
          <div className="flex shrink-0 items-center gap-4">
            {userName && (
              <span className="hidden truncate text-sm text-tc-fg-secondary sm:inline">
                {userName}
              </span>
            )}
            {actions}
          </div>
        </header>

        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
