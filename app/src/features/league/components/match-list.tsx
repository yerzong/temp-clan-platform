"use client";

import { useActionState } from "react";
import type { Match } from "@/lib/domain/types";
import { reportResult, type ActionResult } from "../actions";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: ActionResult = {};

function MatchRow({ match }: { match: Match }) {
  const [, formAction, pending] = useActionState(reportResult, initialState);
  const reported = match.status === "reported";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-tc-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 truncate text-right text-sm text-tc-fg">
          {match.homeTeamName}
        </span>
        <span className="font-mono text-sm tabular-nums text-tc-fg-tertiary">
          {reported ? `${match.homeScore} – ${match.awayScore}` : "vs"}
        </span>
        <span className="flex-1 truncate text-sm text-tc-fg">
          {match.awayTeamName}
        </span>
      </div>

      {!reported && (
        <form
          action={formAction}
          className="flex items-center justify-center gap-2 border-t border-tc-border-soft pt-2"
        >
          <input type="hidden" name="matchId" value={match.id} />
          <input
            type="number"
            name="homeScore"
            min="0"
            required
            className="h-8 w-14 rounded-md border border-tc-border bg-input px-2 text-center text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          />
          <span className="text-tc-fg-muted">–</span>
          <input
            type="number"
            name="awayScore"
            min="0"
            required
            className="h-8 w-14 rounded-md border border-tc-border bg-input px-2 text-center text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-md border border-tc-border bg-tc-surface-2 px-3 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
          >
            Report
          </button>
        </form>
      )}
    </div>
  );
}

export function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches scheduled"
        description="Schedule a fixture between two enrolled teams."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} />
      ))}
    </div>
  );
}
