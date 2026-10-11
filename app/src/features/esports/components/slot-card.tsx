"use client";

import { useState, useTransition } from "react";
import { Crown, Pencil, UserPlus, Link2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { TeamSlot, RosterPlayer } from "@/lib/domain/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { PlayerCard } from "./player-card";
import { assignSlot, clearSlot, renameSlot, setCaptain } from "../actions";

/**
 * A team slot: renders the collectible PlayerCard, plus an edit sheet (rename,
 * captain, remove) for filled slots and an assign sheet (pick a registered
 * player, or invite by link) for empty ones. Both are right-side slide-overs.
 */
export function SlotCard({
  slot,
  available,
}: {
  slot: TeamSlot;
  available: RosterPlayer[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [labelValue, setLabelValue] = useState(slot.label);
  const [pending, start] = useTransition();

  const filled = Boolean(slot.membershipId);

  function run(fn: () => Promise<{ error?: string } | void>, okMsg: string, close?: () => void) {
    start(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(okMsg);
        close?.();
      }
    });
  }

  function doRename() {
    const next = labelValue.trim();
    if (!next) return;
    run(
      () => {
        const fd = new FormData();
        fd.set("slotId", slot.slotId);
        fd.set("label", next);
        return renameSlot({}, fd);
      },
      "Slot renombrado"
    );
  }

  function doAssign(membershipId: string) {
    run(
      () => {
        const fd = new FormData();
        fd.set("slotId", slot.slotId);
        fd.set("membershipId", membershipId);
        return assignSlot({}, fd);
      },
      "Jugador asignado",
      () => setAssignOpen(false)
    );
  }

  function doClear() {
    run(
      () => {
        const fd = new FormData();
        fd.set("slotId", slot.slotId);
        return clearSlot({}, fd);
      },
      "Slot liberado",
      () => setEditOpen(false)
    );
  }

  function doCaptain() {
    run(
      () => {
        const fd = new FormData();
        fd.set("slotId", slot.slotId);
        return setCaptain({}, fd);
      },
      "Capitán asignado",
      () => setEditOpen(false)
    );
  }

  return (
    <div className="relative">
      <PlayerCard slot={slot} onEmptyClick={() => setAssignOpen(true)} />

      {/* Edit affordance on filled cards */}
      {filled && (
        <button
          type="button"
          onClick={() => {
            setLabelValue(slot.label);
            setEditOpen(true);
          }}
          aria-label="Editar slot"
          className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-tc-border bg-[hsl(var(--tc-canvas)/0.8)] text-tc-fg-tertiary backdrop-blur transition-colors hover:border-tc-accent hover:text-tc-fg"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {/* Edit sheet — rename / captain / remove */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar slot"
        description={slot.displayName ?? slot.label}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slot-label">Nombre del slot</Label>
            <div className="flex items-center gap-2">
              <Input
                id="slot-label"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                placeholder="ej. Mid, JG, Coach"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={doRename}
                disabled={pending}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
              Responsable del equipo
            </span>
            {slot.isCaptain ? (
              <p className="flex items-center gap-2 text-sm text-[hsl(var(--tc-amber))]">
                <Crown className="h-4 w-4" />
                Este jugador es el capitán.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={doCaptain}
                disabled={pending}
                className="gap-2"
              >
                <Crown className="h-4 w-4" />
                Marcar como capitán
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
            <Button
              type="button"
              variant="destructive"
              onClick={doClear}
              disabled={pending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Quitar jugador del slot
            </Button>
            <p className="text-[11px] text-tc-fg-muted">
              El slot queda vacío conservando su nombre.
            </p>
          </div>
        </div>
      </Sheet>

      {/* Assign sheet — registered player OR invite link */}
      <Sheet
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Llenar "${slot.label}"`}
        description="Agrega un jugador registrado o invítalo por enlace."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
              <UserPlus className="h-3.5 w-3.5" />
              Jugador registrado
            </span>
            {available.length === 0 ? (
              <p className="text-sm text-tc-fg-muted">
                No hay jugadores disponibles. Marca miembros como jugadores en el
                módulo Miembros.
              </p>
            ) : (
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {available.map((p) => (
                  <button
                    key={p.membershipId}
                    type="button"
                    onClick={() => doAssign(p.membershipId)}
                    disabled={pending}
                    className="flex items-center gap-2 rounded-md border border-tc-border bg-tc-surface-1 px-3 py-2 text-left text-sm text-tc-fg transition-colors hover:border-tc-accent hover:bg-tc-surface-2 disabled:opacity-50"
                  >
                    {p.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-5">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
              <Link2 className="h-3.5 w-3.5" />
              Invitar por enlace
            </span>
            <p className="text-sm text-tc-fg-muted">
              Próximamente: genera un enlace para que un jugador nuevo se una con
              Discord directamente en este slot.
            </p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
