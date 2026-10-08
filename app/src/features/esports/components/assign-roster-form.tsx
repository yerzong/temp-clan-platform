"use client";

import { useActionState, useRef, useEffect } from "react";
import { addToRoster, type ActionResult } from "../actions";
import type { Team, RosterPlayer } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function AssignRosterForm({
  teams,
  players,
}: {
  teams: Team[];
  players: RosterPlayer[];
}) {
  const [state, formAction, pending] = useActionState(
    addToRoster,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-tc-fg-tertiary">
        Create a team first to assign players.
      </p>
    );
  }

  if (players.length === 0) {
    return (
      <p className="text-sm text-tc-fg-tertiary">
        Mark members as players (Overview tab) to assign them.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-team">Team</Label>
        <select
          id="assign-team"
          name="teamId"
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-player">Player</Label>
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
        <Label htmlFor="assign-position">Position (optional)</Label>
        <Input
          id="assign-position"
          name="position"
          placeholder="e.g. Entry, Anchor, IGL"
          autoComplete="off"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Assigning..." : "Assign to team"}
      </Button>
    </form>
  );
}
