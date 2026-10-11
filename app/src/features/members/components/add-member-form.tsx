"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addMember, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RolePicker, type RoleSelection } from "./role-picker";

const initialState: ActionResult = {};

const defaultRoles: RoleSelection = {
  staff: true,
  player: false,
  creator: false,
  admin: false,
};

export function AddMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [roles, setRoles] = useState<RoleSelection>(defaultRoles);

  useActionToast(state, pending, "Miembro agregado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setRoles(defaultRoles);
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="am-name">Nombre del miembro</Label>
        <Input id="am-name" name="displayName" required placeholder="ej. .yerzong" autoComplete="off" />
      </div>

      <RolePicker value={roles} onChange={setRoles} />

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Agregar al roster"}
      </Button>
    </form>
  );
}
