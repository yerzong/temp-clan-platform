"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "./brand-mark";

/**
 * App shell: a fixed left sidebar (brand + nav) plus a sticky top bar over a
 * wide content area. On mobile the sidebar becomes a slide-in drawer toggled by
 * a hamburger in the top bar. Desktop keeps the fixed sidebar.
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: fixed on desktop, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col gap-6 border-r border-tc-border-soft bg-[hsl(var(--tc-canvas))] px-4 py-5 transition-transform duration-200 md:sticky md:top-0 md:z-10 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <BrandMark />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-tc-fg-tertiary hover:text-tc-fg md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1">{nav}</div>
      </aside>

      {/* Right column: top bar + content */}
      <div className="relative z-0 flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-tc-border-soft bg-[hsl(var(--tc-canvas)/0.85)] px-4 py-3.5 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-tc-fg-secondary hover:text-tc-fg md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">{topLeft}</div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {userName && (
              <span className="hidden truncate text-sm text-tc-fg-secondary sm:inline">
                {userName}
              </span>
            )}
            {actions}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
