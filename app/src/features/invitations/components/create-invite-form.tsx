"use client";

import { useActionState } from "react";
import { createInvitation, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const ROLES = [
  { value: "player", label: "Player" },
  { value: "creator", label: "Creator" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export function CreateInviteForm() {
  const [state, formAction, pending] = useActionState(
    createInvitation,
    initialState
  );

  useActionToast(state, pending, "Invite link generated");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Invite as</Label>
        <select
          id="invite-role"
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

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Generating..." : "Generate invite link"}
      </Button>
    </form>
  );
}
