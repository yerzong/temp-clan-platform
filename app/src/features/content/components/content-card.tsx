"use client";

import { useActionState, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import type { ContentPiece, ContentStatus } from "@/lib/domain/types";
import {
  setContentStatus,
  deleteContent,
  type ActionResult,
} from "../actions";
import { Badge } from "@/components/ui/badge";

const initialState: ActionResult = {};

const NEXT_STATUS: Partial<Record<ContentStatus, ContentStatus>> = {
  idea: "editing",
  editing: "review",
  review: "published",
};

const NEXT_LABEL: Partial<Record<ContentStatus, string>> = {
  idea: "Start editing",
  editing: "Send to review",
  review: "Publish",
};

const PLATFORM_LABEL: Record<string, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  tiktok: "TikTok",
  other: "Other",
};

export function ContentCard({ piece }: { piece: ContentPiece }) {
  const [, formAction, pending] = useActionState(
    setContentStatus,
    initialState
  );
  const [, deleteAction, deleting] = useActionState(deleteContent, initialState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const next = NEXT_STATUS[piece.status];

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-tc-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-tc-fg">
          {piece.title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {piece.url && (
            <a
              href={piece.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tc-fg-muted transition-colors hover:text-tc-accent"
              aria-label="Open link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {confirmingDelete ? (
            <form action={deleteAction} className="flex items-center gap-1">
              <input type="hidden" name="contentId" value={piece.id} />
              <button
                type="submit"
                disabled={deleting}
                className="text-[11px] font-medium uppercase text-[hsl(var(--tc-destructive))]"
              >
                {deleting ? "..." : "Del"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-[11px] uppercase text-tc-fg-muted"
              >
                No
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-tc-fg-muted transition-colors hover:text-[hsl(var(--tc-destructive))]"
              aria-label="Delete content"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{PLATFORM_LABEL[piece.platform] ?? piece.platform}</Badge>
        {piece.authorName && (
          <span className="font-mono text-[11px] text-tc-fg-muted">
            {piece.authorName}
          </span>
        )}
      </div>

      {next && (
        <form action={formAction}>
          <input type="hidden" name="contentId" value={piece.id} />
          <input type="hidden" name="status" value={next} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md border border-tc-border bg-tc-surface-2 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
          >
            {NEXT_LABEL[piece.status]}
          </button>
        </form>
      )}
    </div>
  );
}
