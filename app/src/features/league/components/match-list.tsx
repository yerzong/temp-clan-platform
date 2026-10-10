"use client";

import { useActionState, useState, useTransition } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Match } from "@/lib/domain/types";
import { reportResult, getMatchRecap, type ActionResult } from "../actions";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: ActionResult = {};

function MatchRow({ match, leagueId }: { match: Match; leagueId: string }) {
  const [state, formAction, pending] = useActionState(
    reportResult,
    initialState
  );
  const reported = match.status === "reported";

  const [recap, setRecap] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingRecap, startRecap] = useTransition();

  function loadRecap() {
    startRecap(async () => {
      const res = await getMatchRecap(leagueId, match.id);
      if (res.ok && res.recap) {
        setRecap(res.recap);
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  async function copyRecap() {
    if (!recap) return;
    await navigator.clipboard.writeText(recap);
    setCopied(true);
    toast.success("Recap copiado");
    setTimeout(() => setCopied(false), 1500);
  }

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
            Reportar
          </button>
        </form>
      )}

      {reported && (
        <div className="flex flex-col gap-2 border-t border-tc-border-soft pt-2">
          {!recap ? (
            <button
              type="button"
              onClick={loadRecap}
              disabled={loadingRecap}
              className="flex items-center justify-center gap-1.5 rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loadingRecap ? "Generando..." : "Generar recap"}
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-tc-border-soft bg-[hsl(var(--tc-canvas))] p-3">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-tc-fg-secondary">
                {recap}
              </pre>
              <button
                type="button"
                onClick={copyRecap}
                className="flex items-center justify-center gap-1.5 rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar recap
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchList({
  matches,
  leagueId,
}: {
  matches: Match[];
  leagueId: string;
}) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="Sin partidas programadas"
        description="Programa un enfrentamiento entre dos equipos inscritos."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} leagueId={leagueId} />
      ))}
    </div>
  );
}
