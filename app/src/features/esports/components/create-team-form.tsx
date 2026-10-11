"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTeam, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const GAMES = [
  { value: "gears-e-day", label: "Gears E-Day" },
  { value: "valorant", label: "Valorant" },
  { value: "lol", label: "League of Legends" },
  { value: "cs2", label: "Counter-Strike 2" },
  { value: "fortnite", label: "Fortnite" },
  { value: "other", label: "Otro" },
];

const PLATFORMS = [
  { value: "", label: "Sin especificar" },
  { value: "PC", label: "PC" },
  { value: "Xbox", label: "Xbox" },
  { value: "PlayStation", label: "PlayStation" },
  { value: "Cross-play", label: "Cross-play" },
];

export function CreateTeamForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(createTeam, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useActionToast(state, pending, "Equipo creado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-name">Nombre del equipo</Label>
        <Input
          id="team-name"
          name="name"
          required
          placeholder="ej. Temp Tactical Alpha"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-game">Juego</Label>
        <select
          id="team-game"
          name="game"
          defaultValue="gears-e-day"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {GAMES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-platform">Plataforma (opcional)</Label>
        <select
          id="team-platform"
          name="platform"
          defaultValue=""
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-slots">Número de slots</Label>
        <Input
          id="team-slots"
          name="slotCount"
          type="number"
          min={1}
          max={20}
          defaultValue={5}
          required
        />
        <p className="text-[11px] text-tc-fg-muted">
          Se crean vacíos (Slot 1, Slot 2…) y luego los renombras y asignas
          jugadores en el detalle del equipo.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando..." : "Crear equipo"}
      </Button>
    </form>
  );
}
