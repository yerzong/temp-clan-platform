"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AttendanceStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useMountedTransition } from "@/lib/use-mounted-transition";

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "yes", label: "Voy", active: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500" },
  {
    value: "maybe",
    label: "Tal vez",
    active:
      "bg-[hsl(var(--tc-amber))]/15 text-[hsl(var(--tc-amber))] ring-1 ring-[hsl(var(--tc-amber))]",
  },
  {
    value: "no",
    label: "No puedo",
    active:
      "bg-[hsl(var(--tc-destructive))]/15 text-[hsl(var(--tc-destructive))] ring-1 ring-[hsl(var(--tc-destructive))]",
  },
];

/**
 * Confirm/choose an attendance status with an optional reason. Used by players
 * (to add a reason when they can't / might come) and by admins (to change — and
 * confirm — another player's attendance).
 */
export function AttendanceDialog({
  open,
  title,
  initialStatus,
  initialReason,
  pending = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  initialStatus: AttendanceStatus;
  initialReason: string | null;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (status: AttendanceStatus, reason: string | null) => void;
}) {
  const { mounted, closing } = useMountedTransition(open, 220);
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [reason, setReason] = useState(initialReason ?? "");

  useEffect(() => {
    if (open) {
      setStatus(initialStatus === "pending" ? "yes" : initialStatus);
      setReason(initialReason ?? "");
    }
  }, [open, initialStatus, initialReason]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/70 backdrop-blur-[1px]",
          closing ? "tc-overlay-out" : "tc-overlay-in"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-tc-border-strong bg-tc-surface-1 p-5 shadow-2xl",
          closing ? "tc-dialog-out" : "tc-dialog-in"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-tc-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 rounded-md p-1 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatus(o.value)}
              className={`rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                status === o.value
                  ? o.active
                  : "border border-tc-border text-tc-fg-tertiary hover:bg-tc-surface-2"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {(status === "no" || status === "maybe") && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-tc-fg-tertiary">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ej. Tengo examen, llego tarde…"
              className="w-full resize-y rounded-md border border-tc-border bg-input px-3 py-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-tc-fg-tertiary transition-colors hover:text-tc-fg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(status, reason.trim() || null)}
            disabled={pending}
            className="rounded-md bg-[hsl(var(--tc-accent))] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[hsl(var(--tc-accent-hover))] disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
