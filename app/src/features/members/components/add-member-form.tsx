"use client";

import { useActionState, useRef, useEffect } from "react";
import { addMember, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "player", label: "Player" },
  { value: "creator", label: "Creator" },
  { value: "admin", label: "Admin" },
];

export function AddMemberForm() {
  const [state, formAction, pending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useActionToast(state, pending, "Member added");

  // Clear the form after a successful add (no error and not pending).
  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Operator name</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          placeholder="e.g. .yerzong"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="player"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2.5">
        <Label>Attributes</Label>
        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isPlayer"
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Competes (player)
          </label>
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isCreator"
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Creates content
          </label>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Adding..." : "Add to roster"}
      </Button>
    </form>
  );
}
