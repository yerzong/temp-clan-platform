"use client";

import { Shield, Swords, Clapperboard, Users, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Member } from "@/lib/domain/types";
import { usePagination } from "@/lib/use-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { MemberCard } from "./member-card";

/**
 * Roster grouped by role. Each member lands in EXACTLY ONE section following a
 * clear priority: Admin > Players > Creators > Staff. A member with no function
 * at all falls into Staff so nobody disappears. Their other functions still
 * show as badges on the card.
 */

interface RoleGroup {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  members: Member[];
}

/** Which single section a member belongs to, by priority. */
function primaryGroupKey(m: Member): "admins" | "players" | "creators" | "staff" {
  if (m.isAdmin) return "admins";
  if (m.isPlayer) return "players";
  if (m.isCreator) return "creators";
  return "staff"; // staff flag OR no function at all
}

function groupByRole(members: Member[]): RoleGroup[] {
  const buckets: Record<string, Member[]> = {
    admins: [],
    staff: [],
    players: [],
    creators: [],
  };
  for (const m of members) buckets[primaryGroupKey(m)].push(m);

  const groups: RoleGroup[] = [
    { key: "admins", label: "Admin", hint: "Gestionan la organización", icon: UserCog, members: buckets.admins },
    { key: "staff", label: "Staff", hint: "Operan la organización", icon: Shield, members: buckets.staff },
    { key: "players", label: "Jugadores", hint: "Compiten en equipos", icon: Swords, members: buckets.players },
    { key: "creators", label: "Creadores", hint: "Producen contenido", icon: Clapperboard, members: buckets.creators },
  ];
  // Hide empty groups so "all" view stays clean.
  return groups.filter((g) => g.members.length > 0);
}

export type RoleFilter = "all" | "admins" | "staff" | "players" | "creators";

/** A specific filter: one group with everyone who HAS that function/permission. */
function groupByFilter(members: Member[], filter: RoleFilter): RoleGroup[] {
  const defs: Record<
    Exclude<RoleFilter, "all">,
    { label: string; hint: string; icon: LucideIcon; has: (m: Member) => boolean }
  > = {
    admins: { label: "Admin", hint: "Gestionan la organización", icon: UserCog, has: (m) => m.isAdmin },
    staff: { label: "Staff", hint: "Operan la organización", icon: Shield, has: (m) => m.isStaff },
    players: { label: "Jugadores", hint: "Compiten en equipos", icon: Swords, has: (m) => m.isPlayer },
    creators: { label: "Creadores", hint: "Producen contenido", icon: Clapperboard, has: (m) => m.isCreator },
  };
  if (filter === "all") return [];
  const def = defs[filter];
  const matched = members.filter(def.has);
  if (matched.length === 0) return [];
  return [{ key: filter, label: def.label, hint: def.hint, icon: def.icon, members: matched }];
}

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

  // "all" view: each member shown once in their primary group.
  // A specific filter: show everyone who HAS that function/permission, even if
  // their primary group is different (e.g. an admin who is also a player shows
  // up under the "Jugadores" filter).
  const groups =
    filter === "all"
      ? groupByRole(members)
      : groupByFilter(members, filter);

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
