"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Right-side slide-over drawer. Overlays content (does not push the layout):
 * a dimmed backdrop + a panel that slides in from the right. Closes on Escape,
 * backdrop click, or the X button. Locks body scroll while open and renders
 * through a portal so it sits above everything.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="tc-overlay-in absolute inset-0 bg-black/60 backdrop-blur-[1px]"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="tc-sheet-in relative z-10 flex h-full w-full max-w-md flex-col border-l border-tc-border-strong bg-tc-surface-1 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-tc-border px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight text-tc-fg">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-tc-fg-tertiary">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
