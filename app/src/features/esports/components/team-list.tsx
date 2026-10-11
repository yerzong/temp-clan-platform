"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { Team } from "@/lib/domain/types";
import { usePagination } from "@/lib/use-pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export const GAME_LABELS: Record<string, string> = {
  "gears-e-day": "Gears E-Day",
  valorant: "Valorant",
  lol: "League of Legends",
  cs2: "Counter-Strike 2",
  fortnite: "Fortnite",
  other: "Otro",
};

/** Paginated list of teams. Each row links to the team detail page. */
export function TeamList({ teams }: { teams: Team[] }) {
  const pager = usePagination(teams, 10);

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-4 w-4" />}
        title="Sin equipos aún"
        description="Crea tu primer squad con el botón de arriba para empezar a armar el roster."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pager.pageItems.map((team) => (
        <Link
          key={team.id}
          href={`/dashboard/esports/${team.id}`}
          className="group flex items-center gap-4 rounded-lg border border-tc-border bg-card p-4 transition-colors hover:border-tc-border-strong hover:bg-tc-surface-1"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate font-medium text-tc-fg">{team.name}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge>{GAME_LABELS[team.game] ?? team.game}</Badge>
              {team.platform && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-tc-fg-muted">
                  {team.platform}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-tc-fg-tertiary">
            <Users className="h-4 w-4" />
            <span className="font-mono text-sm tabular-nums">
              {team.rosterCount}/{team.maxSlots}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-tc-fg-muted transition-colors group-hover:text-tc-fg" />
        </Link>
      ))}
      <Pagination
        page={pager.page}
        pageSize={pager.pageSize}
        pageCount={pager.pageCount}
        canPrev={pager.canPrev}
        canNext={pager.canNext}
        onPrev={() => pager.setPage(pager.page - 1)}
        onNext={() => pager.setPage(pager.page + 1)}
        onPageSize={pager.setPageSize}
        rangeStart={pager.rangeStart}
        rangeEnd={pager.rangeEnd}
        total={pager.total}
        noun="equipos"
      />
    </div>
  );
}
