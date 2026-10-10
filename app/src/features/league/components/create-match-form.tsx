"use client";

import { useActionState } from "react";
import { createMatch, type ActionResult } from "../actions";
import type { LeagueTeam } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

export function CreateMatchForm({
  leagueId,
  teams,
}: {
  leagueId: string;
  teams: LeagueTeam[];
}) {
  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState
  );

  if (teams.length < 2) {
    return (
      <p className="text-sm text-tc-fg-tertiary">
        Inscribe al menos dos equipos para programar una partida.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="leagueId" value={leagueId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="home-team">Equipo local</Label>
        <select
          id="home-team"
          name="homeTeamId"
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
        <Label htmlFor="away-team">Equipo visitante</Label>
        <select
          id="away-team"
          name="awayTeamId"
          defaultValue={teams[1]?.id}
          className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent focus-visible:ring-1 focus-visible:ring-ring"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
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
        {pending ? "Programando..." : "Programar partida"}
      </Button>
    </form>
  );
}
