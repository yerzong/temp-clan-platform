"use client";

import Link from "next/link";
import { Users, Crown } from "lucide-react";
import type { Team } from "@/lib/domain/types";
import { usePagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
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

/**
 * Stylized per-game cover (no copyrighted art): a themed gradient + the game
 * name as a HUD label. Each game gets its own color world.
 */
const GAME_COVER: Record<string, string> = {
  "gears-e-day": "from-[hsl(14_70%_28%)] via-[hsl(20_25%_14%)] to-[hsl(20_8%_8%)]",
  valorant: "from-[hsl(353_65%_30%)] via-[hsl(220_30%_14%)] to-[hsl(20_8%_8%)]",
  lol: "from-[hsl(205_60%_28%)] via-[hsl(210_30%_14%)] to-[hsl(20_8%_8%)]",
  cs2: "from-[hsl(32_70%_30%)] via-[hsl(30_25%_14%)] to-[hsl(20_8%_8%)]",
  fortnite: "from-[hsl(265_55%_32%)] via-[hsl(260_30%_15%)] to-[hsl(20_8%_8%)]",
  other: "from-tc-surface-3 via-tc-surface-1 to-[hsl(20_8%_8%)]",
};

/** Paginated grid of teams. Each card has a game cover and links to detail. */
export function TeamList({ teams }: { teams: Team[] }) {
  const pager = usePagination(teams, 9);

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
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pager.pageItems.map((team) => {
          const captain = team.slots.find((s) => s.isCaptain);
          return (
            <Link
              key={team.id}
              href={`/dashboard/esports/${team.id}`}
              className="group overflow-hidden rounded-xl border border-tc-border bg-card transition-colors hover:border-tc-border-strong"
            >
              {/* Game cover */}
              <div
                className={cn(
                  "relative flex h-24 items-end bg-gradient-to-br p-3",
                  GAME_COVER[team.game] ?? GAME_COVER.other
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "linear-gradient(hsl(var(--tc-fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--tc-fg)) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <span className="relative font-mono text-[10px] font-medium uppercase tracking-widest text-tc-fg-secondary">
                  {GAME_LABELS[team.game] ?? team.game}
                </span>
                {team.platform && (
                  <span className="absolute right-3 top-3 rounded border border-tc-border-strong bg-[hsl(var(--tc-canvas)/0.5)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tc-fg-tertiary backdrop-blur">
                    {team.platform}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold text-tc-fg transition-colors group-hover:text-[hsl(var(--tc-accent-hover))]">
                    {team.name}
                  </span>
                  {captain?.displayName ? (
                    <span className="flex items-center gap-1 text-[11px] text-tc-fg-tertiary">
                      <Crown className="h-3 w-3 text-[hsl(var(--tc-amber))]" />
                      {captain.displayName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-tc-fg-muted">
                      Sin capitán
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-tc-fg-tertiary">
                  <Users className="h-4 w-4" />
                  <span className="font-mono text-sm tabular-nums">
                    {team.rosterCount}/{team.maxSlots}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

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
