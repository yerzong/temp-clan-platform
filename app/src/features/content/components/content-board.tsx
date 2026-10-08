import type { ContentPiece, ContentStatus } from "@/lib/domain/types";
import { ContentCard } from "./content-card";

const COLUMNS: { status: ContentStatus; label: string }[] = [
  { status: "idea", label: "Ideas" },
  { status: "editing", label: "Editing" },
  { status: "review", label: "Review" },
  { status: "published", label: "Published" },
];

/** Kanban board of content pieces grouped by pipeline status. */
export function ContentBoard({ pieces }: { pieces: ContentPiece[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = pieces.filter((p) => p.status === col.status);
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
                items.map((p) => <ContentCard key={p.id} piece={p} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
