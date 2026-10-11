"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useMountedTransition } from "@/lib/use-mounted-transition";
import { Button } from "@/components/ui/button";

/**
 * Centered confirmation dialog. A dimmed backdrop + a centered card that scales
 * in and out. Generic: pass a title, message, and the confirm handler. Use for
 * destructive confirmations (delete) or any yes/no decision. Closes on Escape,
 * backdrop click, or Cancel. Renders through a portal and locks body scroll.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
}) {
  const { mounted, closing } = useMountedTransition(open, 220);

  useEffect(() => {
    if (!mounted) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, onClose, pending]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !pending && onClose()}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-[1px]",
          closing ? "tc-overlay-out" : "tc-overlay-in"
        )}
      />

      {/* Card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-sm rounded-lg border border-tc-border-strong bg-tc-surface-1 p-6 shadow-2xl",
          closing ? "tc-dialog-out" : "tc-dialog-in"
        )}
      >
        <h2 className="text-lg font-semibold tracking-tight text-tc-fg">
          {title}
        </h2>
        {description && (
          <div className="mt-2 text-sm leading-relaxed text-tc-fg-tertiary">
            {description}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
