import { Shield, Swords, Clapperboard, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Member } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/empty-state";
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
  const staff: Member[] = [];
  const players: Member[] = [];
  const creators: Member[] = [];

  for (const m of members) {
    const isStaffCore =
      m.role === "owner" || m.role === "admin" || m.role === "staff";

    if (m.isPlayer) {
      players.push(m);
    } else if (m.isCreator) {
      creators.push(m);
    } else if (isStaffCore) {
      staff.push(m);
    } else {
      // Fallback: a member with no player/creator attribute and a non-staff
      // role still needs a home — treat as staff so nobody disappears.
      staff.push(m);
    }
  }

  return [
    {
      key: "staff",
      label: "Staff",
      hint: "Dueños, admins y staff",
      icon: Shield,
      members: staff,
    },
    {
      key: "players",
      label: "Jugadores",
      hint: "Compiten en equipos",
      icon: Swords,
      members: players,
    },
    {
      key: "creators",
      label: "Creadores",
      hint: "Producen contenido",
      icon: Clapperboard,
      members: creators,
    },
  ];
}

export function MembersRoster({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-4 w-4" />}
        title="Sin operadores desplegados"
        description="Agrega tu primer miembro de staff, jugador o creador con el botón de arriba."
      />
    );
  }

  const groups = groupByRole(members);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.key} className="flex flex-col gap-3">
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
              <div className="flex flex-col gap-2.5">
                {group.members.map((m) => (
                  <MemberCard key={m.membershipId} member={m} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
