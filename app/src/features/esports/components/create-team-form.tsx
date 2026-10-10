"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTeam, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const FORMATS = [
  { value: "versus-4v4", label: "Versus 4v4" },
  { value: "horde-siege", label: "Horde Siege (12)" },
];

const T = {
  name: "Nombre del equipo",
  format: "Formato",
  creating: "Creando...",
  create: "Crear equipo",
};

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(createTeam, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useActionToast(state, pending, "Team created");

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-name">{T.name}</Label>
        <Input
          id="team-name"
          name="name"
          required
          placeholder="Temp Tactical Alpha"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-format">{T.format}</Label>
        <select
          id="team-format"
          name="format"
          defaultValue="versus-4v4"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
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
        {pending ? T.creating : T.create}
      </Button>
    </form>
  );
}
