import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

/**
 * App shell: the reusable frame (header + content area) for every signed-in
 * screen. Modules render their content as children — the shell is generic and
 * knows nothing about any specific feature.
 */
export function AppShell({
  children,
  userName,
  actions,
}: {
  children: ReactNode;
  userName?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-tc-border-soft bg-[hsl(var(--tc-canvas)/0.85)] px-6 py-4 backdrop-blur">
        <BrandMark />
        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden text-sm text-tc-fg-secondary sm:inline">
              {userName}
            </span>
          )}
          {actions}
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
