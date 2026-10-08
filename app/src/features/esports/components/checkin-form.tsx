"use client";

import { useActionState, useRef, useEffect } from "react";
import { addCheckin, type ActionResult } from "../actions";
import type { RosterPlayer } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const SCALE = [1, 2, 3, 4, 5];

/**
 * Wellbeing check-in form. Self-reported signals — a tool to care for players,
 * not a medical assessment.
 */
export function CheckinForm({ players }: { players: RosterPlayer[] }) {
  const [state, formAction, pending] = useActionState(addCheckin, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (players.length === 0) {
    return (
      <p className="text-sm text-tc-fg-tertiary">
        Add players to a team first to record check-ins.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkin-player">Player</Label>
        <select
          id="checkin-player"
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkin-mood">Mood (1-5)</Label>
          <select
            id="checkin-mood"
            name="mood"
            defaultValue="3"
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {SCALE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkin-rest">Rest (1-5)</Label>
          <select
            id="checkin-rest"
            name="rest"
            defaultValue="3"
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {SCALE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkin-hours">Practice hours today</Label>
        <Input
          id="checkin-hours"
          name="practiceHours"
          type="number"
          min="0"
          max="24"
          step="0.5"
          defaultValue="0"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkin-note">Note (optional)</Label>
        <Input id="checkin-note" name="note" placeholder="Anything to flag?" />
      </div>

      {state.error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Record check-in"}
      </Button>

      <p className="text-[11px] leading-relaxed text-tc-fg-muted">
        Self-reported signals to help you support your players. Not medical
        advice or a diagnosis.
      </p>
    </form>
  );
}
