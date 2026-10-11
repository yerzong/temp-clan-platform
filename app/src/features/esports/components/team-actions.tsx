"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Team } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { updateTeam, addSlot, type ActionResult } from "../actions";

const initialState: ActionResult = {};

const GAMES = [
  { value: "gears-e-day", label: "Gears E-Day" },
  { value: "valorant", label: "Valorant" },
  { value: "lol", label: "League of Legends" },
  { value: "cs2", label: "Counter-Strike 2" },
  { value: "fortnite", label: "Fortnite" },
  { value: "other", label: "Otro" },
];

const PLATFORMS = ["", "PC", "Xbox", "PlayStation", "Cross-play"];

/** Edit-team slide-over + add-slot button, shown on the team detail header. */
export function TeamActions({ team }: { team: Team }) {
  const [editOpen, setEditOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateTeam, initialState);
  const [adding, startAdd] = useTransition();
  const wasPending = useRef(false);

  useActionToast(state, pending, "Equipo actualizado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditOpen(false);
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function doAddSlot() {
    startAdd(async () => {
      const fd = new FormData();
      fd.set("teamId", team.id);
      const res = await addSlot({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Slot agregado");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditOpen(true)}
        className="gap-1.5"
      >
        <Pencil className="h-4 w-4" />
        Editar equipo
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={doAddSlot}
        disabled={adding}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Agregar slot
      </Button>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar equipo"
        description="Cambia el nombre, el juego o la plataforma."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="teamId" value={team.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="et-name">Nombre del equipo</Label>
            <Input id="et-name" name="name" defaultValue={team.name} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="et-game">Juego</Label>
            <select
              id="et-game"
              name="game"
              defaultValue={team.game}
              className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
            >
              {GAMES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="et-platform">Plataforma (opcional)</Label>
            <select
              id="et-platform"
              name="platform"
              defaultValue={team.platform ?? ""}
              className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p === "" ? "Sin especificar" : p}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
