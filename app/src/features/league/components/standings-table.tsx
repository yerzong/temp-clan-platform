import type { StandingRow } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/empty-state";

/** Standings table derived from reported match results. */
export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No standings yet"
        description="Enroll teams and report match results to build the table."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-tc-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tc-border bg-tc-surface-2 text-left font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 text-center font-medium">P</th>
            <th className="px-3 py-2 text-center font-medium">W</th>
            <th className="px-3 py-2 text-center font-medium">L</th>
            <th className="px-3 py-2 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.teamId}
              className="border-b border-tc-border-soft last:border-0"
            >
              <td className="px-3 py-2 font-mono text-tc-fg-muted">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-tc-fg">{r.teamName}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-tc-fg-tertiary">
                {r.played}
              </td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-tc-fg-tertiary">
                {r.won}
              </td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-tc-fg-tertiary">
                {r.lost}
              </td>
              <td className="px-3 py-2 text-center font-mono font-semibold tabular-nums text-[hsl(var(--tc-accent-hover))]">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
