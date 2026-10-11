"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Member } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMember, type ActionResult } from "../actions";

const initialState: ActionResult = {};

const EDITABLE_ROLES = [
  { value: "staff", label: "Staff" },
  { value: "player", label: "Jugador" },
  { value: "creator", label: "Creador" },
  { value: "admin", label: "Admin" },
];

/**
 * Edit form for a single member. Mirrors AddMemberForm's shape so both live in
 * the same slide-over. Calls onSuccess once a save settles without error.
 */
export function EditMemberForm({
  member,
  onSuccess,
}: {
  member: Member;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateMember,
    initialState
  );
  const wasPending = useRef(false);
  const isOwner = member.role === "owner";

  useActionToast(state, pending, "Miembro actualizado");

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="membershipId" value={member.membershipId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`name-${member.membershipId}`}>Nombre</Label>
        <Input
          id={`name-${member.membershipId}`}
          name="displayName"
          defaultValue={member.displayName}
          required
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`role-${member.membershipId}`}>Rol</Label>
        <select
          id={`role-${member.membershipId}`}
          name="role"
          defaultValue={isOwner ? "admin" : member.role}
          disabled={isOwner}
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent disabled:opacity-60"
        >
          {isOwner && <option value="owner">Dueño</option>}
          {EDITABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {isOwner && (
          <p className="text-[11px] text-tc-fg-muted">
            No se puede cambiar el rol del dueño.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <Label>Atributos</Label>
        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isPlayer"
              defaultChecked={member.isPlayer}
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Jugador
          </label>
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isCreator"
              defaultChecked={member.isCreator}
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Creador
          </label>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
