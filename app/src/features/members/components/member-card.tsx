import type { Member } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";

type RoleVariant = "owner" | "admin" | "staff" | "creator" | "player";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Operator dossier card — the design signature for Temp Platform. */
export function MemberCard({ member }: { member: Member }) {
  return (
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-tc-border bg-card p-4 transition-all hover:border-tc-border-strong hover:bg-tc-surface-1">
      {/* Rank edge — appears on hover as a command accent */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-[hsl(var(--tc-accent))] opacity-0 transition-opacity group-hover:opacity-100"
      />

      {/* Avatar / insignia */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2 transition-colors group-hover:border-tc-border-strong">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-mono text-sm font-semibold text-tc-fg-tertiary">
            {initials(member.displayName)}
          </span>
        )}
        {member.status === "active" && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[hsl(var(--tc-success))]" />
        )}
      </div>

      {/* Identity */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-medium text-tc-fg">
          {member.displayName}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={member.role as RoleVariant}>{member.role}</Badge>
          {member.isPlayer && <Badge variant="player">player</Badge>}
          {member.isCreator && <Badge variant="creator">creator</Badge>}
        </div>
      </div>

      {/* Status readout */}
      <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
        {member.status}
      </span>
    </div>
  );
}
