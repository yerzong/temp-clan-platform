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
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-tc-border-soft px-6 py-4">
        <BrandMark />
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-tc-fg-secondary">{userName}</span>
          )}
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
