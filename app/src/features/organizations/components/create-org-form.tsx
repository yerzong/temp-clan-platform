"use client";

import { useActionState } from "react";
import { createOrganization, type ActionResult } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(
    createOrganization,
    initialState
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre de la organización</Label>
        <Input id="name" name="name" required placeholder="Temp Tactical" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug (identificador de URL)</Label>
        <Input id="slug" name="slug" required placeholder="temp-tactical" />
        <p className="font-mono text-[11px] text-tc-fg-muted">
          minúsculas · números · guiones
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Creando..." : "Crear organización"}
      </Button>
    </form>
  );
}
