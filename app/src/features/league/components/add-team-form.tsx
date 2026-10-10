"use client";

import { useActionState, useRef, useEffect } from "react";
import { addLeagueTeam, type ActionResult } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function AddTeamForm({ leagueId }: { leagueId: string }) {
  const [state, formAction, pending] = useActionState(
    addLeagueTeam,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="leagueId" value={leagueId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-name">Nombre del equipo</Label>
        <Input
          id="team-name"
          name="name"
          required
          placeholder="Nombre del squad externo"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-contact">Contacto (opcional)</Label>
        <Input
          id="team-contact"
          name="contact"
          placeholder="Discord / email del capitán"
          autoComplete="off"
        />
      </div>
      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Inscribir equipo"}
      </Button>
    </form>
  );
}
