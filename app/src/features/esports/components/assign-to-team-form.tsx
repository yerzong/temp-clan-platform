"use client";

import { useActionState, useRef, useEffect } from "react";
import { addToRoster, type ActionResult } from "../actions";
import type { RosterPlayer } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

/** Assign a player to a FIXED team (the one on the detail page). */
export function AssignToTeamForm({
  teamId,
  players,
}: {
  teamId: string;
  players: RosterPlayer[];
}) {
  const [state, formAction, pending] = useActionState(addToRoster, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useActionToast(state, pending, "Jugador asignado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (players.length === 0) {
    return (
      <p className="text-sm text-tc-fg-tertiary">
        Marca miembros como jugadores (módulo Miembros) para poder asignarlos.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="teamId" value={teamId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-player">Jugador</Label>
        <select
          id="assign-player"
          name="membershipId"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {players.map((p) => (
            <option key={p.membershipId} value={p.membershipId}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-position">Posición (opcional)</Label>
        <Input
          id="assign-position"
          name="position"
          placeholder="ej. Entry, Anchor, IGL"
          autoComplete="off"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Asignando..." : "Asignar al roster"}
      </Button>
    </form>
  );
}
