"use client";

import { useState, useTransition } from "react";
import { Crown, Pencil, UserPlus, X, Check, Star } from "lucide-react";
import { toast } from "sonner";
import type { TeamSlot, RosterPlayer } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assignSlot, clearSlot, renameSlot, setCaptain } from "../actions";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * One team slot card. Empty slots offer "assign a registered player". Filled
 * slots show the player with captain + remove actions. The label is editable.
 */
export function SlotCard({
  slot,
  available,
}: {
  slot: TeamSlot;
  available: RosterPlayer[];
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(slot.label);
  const [assigning, setAssigning] = useState(false);
  const [pending, start] = useTransition();

  const filled = Boolean(slot.membershipId);

  function doRename() {
    const next = labelValue.trim();
    if (!next || next === slot.label) {
      setEditingLabel(false);
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("slotId", slot.slotId);
      fd.set("label", next);
      const res = await renameSlot({}, fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Slot renombrado");
        setEditingLabel(false);
      }
    });
  }

  function doAssign(membershipId: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("slotId", slot.slotId);
      fd.set("membershipId", membershipId);
      const res = await assignSlot({}, fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Jugador asignado");
        setAssigning(false);
      }
    });
  }

  function doClear() {
    start(async () => {
      const fd = new FormData();
      fd.set("slotId", slot.slotId);
      const res = await clearSlot({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Slot liberado");
    });
  }

  function doCaptain() {
    start(async () => {
      const fd = new FormData();
      fd.set("slotId", slot.slotId);
      const res = await setCaptain({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Capitán asignado");
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors",
        slot.isCaptain
          ? "border-[hsl(var(--tc-amber)/0.5)]"
          : "border-tc-border"
      )}
    >
      {/* Label row (editable) */}
      <div className="flex items-center justify-between gap-2">
        {editingLabel ? (
          <div className="flex flex-1 items-center gap-1.5">
            <Input
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && doRename()}
            />
            <button
              type="button"
              onClick={doRename}
              disabled={pending}
              aria-label="Guardar nombre"
              className="rounded p-1 text-tc-fg-tertiary hover:text-tc-fg"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setLabelValue(slot.label);
              setEditingLabel(true);
            }}
            className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary hover:text-tc-fg"
          >
            {slot.label}
            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        {slot.isCaptain && (
          <span
            title="Capitán"
            className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--tc-amber)/0.4)] bg-[hsl(var(--tc-amber)/0.12)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--tc-amber))]"
          >
            <Crown className="h-3 w-3" />
            Capitán
          </span>
        )}
      </div>

      {/* Body: filled vs empty */}
      {filled ? (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2">
            {slot.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slot.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-sm font-semibold text-tc-fg-tertiary">
                {initials(slot.displayName ?? "")}
              </span>
            )}
          </div>
          <span className="flex-1 truncate font-medium text-tc-fg">
            {slot.displayName}
          </span>
          <div className="flex items-center gap-1">
            {!slot.isCaptain && (
              <button
                type="button"
                onClick={doCaptain}
                disabled={pending}
                aria-label="Marcar como capitán"
                title="Marcar como capitán"
                className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-amber))]"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={doClear}
              disabled={pending}
              aria-label="Quitar jugador"
              title="Quitar del slot"
              className="rounded-md p-1.5 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : assigning ? (
        <div className="flex flex-col gap-2">
          {available.length === 0 ? (
            <p className="text-xs text-tc-fg-muted">
              No hay jugadores disponibles. Marca miembros como jugadores en
              Miembros.
            </p>
          ) : (
            <select
              onChange={(e) => e.target.value && doAssign(e.target.value)}
              defaultValue=""
              disabled={pending}
              className="h-9 w-full rounded-md border border-tc-border bg-input px-2 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
            >
              <option value="" disabled>
                Elige un jugador…
              </option>
              {available.map((p) => (
                <option key={p.membershipId} value={p.membershipId}>
                  {p.displayName}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setAssigning(false)}
            className="self-start text-[11px] text-tc-fg-muted hover:text-tc-fg"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAssigning(true)}
          className="flex items-center justify-center gap-2 rounded-md border border-dashed border-tc-border-strong py-3 text-sm text-tc-fg-tertiary transition-colors hover:border-tc-accent hover:text-tc-fg"
        >
          <UserPlus className="h-4 w-4" />
          Asignar jugador
        </button>
      )}
    </div>
  );
}
