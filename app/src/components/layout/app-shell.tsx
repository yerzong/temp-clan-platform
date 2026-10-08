import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

/**
 * App shell with a fixed left sidebar (brand + nav + user/actions) and a wide
 * content area. The sidebar shares the canvas background with a border — not a
 * different color — so the space reads as one surface, not two worlds.
 */
export function AppShell({
  children,
  userName,
  actions,
  nav,
}: {
  children: ReactNode;
  userName?: string;
  actions?: ReactNode;
  nav?: ReactNode;
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

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col gap-6 border-b border-tc-border-soft bg-[hsl(var(--tc-canvas))] px-4 py-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="px-2">
          <BrandMark />
        </div>

        <div className="flex-1">{nav}</div>

        <div className="flex flex-col gap-3 border-t border-tc-border-soft px-2 pt-4">
          {userName && (
            <span className="truncate text-sm text-tc-fg-secondary">
              {userName}
            </span>
          )}
          {actions}
        </div>
      </aside>

      {/* Content */}
      <main className="relative z-0 min-w-0 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
