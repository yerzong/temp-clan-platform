"use client";

import { Shield, Swords, Clapperboard, Users, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Member } from "@/lib/domain/types";
import { usePagination } from "@/lib/use-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { MemberCard } from "./member-card";

/**
 * Roster grouped by role. Each member lands in exactly one section following a
 * clear priority: staff core (owner/admin/staff) -> players -> creators.
 * Extra attributes (player/creator) still show as badges on the card.
 */

interface RoleGroup {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  members: Member[];
}

function groupByRole(members: Member[]): RoleGroup[] {
  // Functions can combine, so a member may appear in several groups. A member
  // with no function at all falls into Staff so nobody disappears.
  const staff = members.filter((m) => m.isStaff || (!m.isPlayer && !m.isCreator));
  const players = members.filter((m) => m.isPlayer);
  const creators = members.filter((m) => m.isCreator);
  const admins = members.filter((m) => m.isAdmin);

  const groups: RoleGroup[] = [
    { key: "admins", label: "Admin", hint: "Gestionan la organización", icon: UserCog, members: admins },
    { key: "staff", label: "Staff", hint: "Operan la organización", icon: Shield, members: staff },
    { key: "players", label: "Jugadores", hint: "Compiten en equipos", icon: Swords, members: players },
    { key: "creators", label: "Creadores", hint: "Producen contenido", icon: Clapperboard, members: creators },
  ];
  // Hide empty groups so "all" view stays clean.
  return groups.filter((g) => g.members.length > 0);
}

export type RoleFilter = "all" | "admins" | "staff" | "players" | "creators";

export function MembersRoster({
  members,
  filter = "all",
  liveSet,
  emptyTitle = "Sin operadores desplegados",
  emptyDescription = "Agrega tu primer miembro de staff, jugador o creador con el botón de arriba.",
}: {
  members: Member[];
  filter?: RoleFilter;
  liveSet?: Set<string>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-4 w-4" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const groups = groupByRole(members).filter(
    (g) => filter === "all" || g.key === filter
  );

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <RoleSection key={group.key} group={group} liveSet={liveSet} />
      ))}
    </div>
  );
}

/** One role group with its own pagination (10 per page). */
function RoleSection({
  group,
  liveSet,
}: {
  group: RoleGroup;
  liveSet?: Set<string>;
}) {
  const Icon = group.icon;
  const pager = usePagination(group.members, 10);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 border-b border-tc-border pb-2">
        <Icon className="h-4 w-4 text-[hsl(var(--tc-accent-hover))]" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-secondary">
          {group.label}
        </h2>
        <span className="font-mono text-[11px] text-tc-fg-muted">
          {group.members.length}
        </span>
        <span className="ml-auto text-[11px] text-tc-fg-muted">
          {group.hint}
        </span>
      </div>

      {group.members.length === 0 ? (
        <p className="px-1 text-sm text-tc-fg-muted">
          Nadie en esta sección todavía.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {pager.pageItems.map((m) => (
              <MemberCard
                key={m.membershipId}
                member={m}
                isLive={liveSet?.has(m.membershipId) ?? false}
              />
            ))}
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
            noun="miembros"
          />
        </>
      )}
    </section>
  );
}
