"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { ContentPiece, ContentStatus } from "@/lib/domain/types";
import { ContentCard, type CreatorOption } from "./content-card";

const COLUMNS: { status: ContentStatus; label: string }[] = [
  { status: "idea", label: "Ideas" },
  { status: "editing", label: "Editing" },
  { status: "review", label: "Review" },
  { status: "published", label: "Published" },
];

const ALL = "__all__";
const UNASSIGNED = "__unassigned__";

/** Kanban board of content pieces grouped by status, filterable by creator. */
export function ContentBoard({
  pieces,
  creators,
}: {
  pieces: ContentPiece[];
  creators: CreatorOption[];
}) {
  const [filter, setFilter] = useState<string>(ALL);

  const visible = useMemo(() => {
    if (filter === ALL) return pieces;
    if (filter === UNASSIGNED)
      return pieces.filter((p) => !p.authorMembershipId);
    return pieces.filter((p) => p.authorMembershipId === filter);
  }, [pieces, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-tc-fg-muted" />
        <label className="text-[11px] font-medium uppercase tracking-wider text-tc-fg-tertiary">
          Creador
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 rounded-md border border-tc-border bg-input px-2.5 text-xs text-tc-fg outline-none focus-visible:border-tc-accent"
        >
          <option value={ALL}>Todos</option>
          <option value={UNASSIGNED}>Sin asignar</option>
          {creators.map((c) => (
            <option key={c.membershipId} value={c.membershipId}>
              {c.displayName}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-tc-fg-muted">
          {visible.length} de {pieces.length}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((p) => p.status === col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
                  {col.label}
                </h3>
                <span className="font-mono text-[11px] tabular-nums text-tc-fg-muted">
                  {items.length}
                </span>
              </div>
              <div className="flex min-h-[80px] flex-col gap-2.5 rounded-lg border border-dashed border-tc-border-soft p-2">
                {items.length === 0 ? (
                  <span className="px-1 py-6 text-center font-mono text-[11px] text-tc-fg-muted">
                    empty
                  </span>
                ) : (
                  items.map((p) => (
                    <ContentCard key={p.id} piece={p} creators={creators} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
