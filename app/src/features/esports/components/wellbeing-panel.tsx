import { HeartPulse } from "lucide-react";
import type { PlayerWellbeing } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/empty-state";
import { BurnoutBadge } from "./burnout-badge";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Player sustainability overview — latest check-in + burnout signal. */
export function WellbeingPanel({ players }: { players: PlayerWellbeing[] }) {
  if (players.length === 0) {
    return (
      <EmptyState
        icon={<HeartPulse className="h-4 w-4" />}
        title="No players to track"
        description="Mark members as players, then record wellbeing check-ins to monitor burnout."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {players.map((p) => (
        <div
          key={p.membershipId}
          className="flex items-center gap-4 rounded-lg border border-tc-border bg-card p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2">
            {p.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-xs font-semibold text-tc-fg-tertiary">
                {initials(p.displayName)}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium text-tc-fg">
              {p.displayName}
            </span>
            {p.latest ? (
              <span className="font-mono text-[11px] text-tc-fg-tertiary">
                mood {p.latest.mood}/5 · rest {p.latest.rest}/5 ·{" "}
                {p.latest.practiceHours}h · {p.latest.checkinDate}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-tc-fg-muted">
                no recent check-in
              </span>
            )}
          </div>

          <BurnoutBadge signal={p.signal} />
        </div>
      ))}
    </div>
  );
}
