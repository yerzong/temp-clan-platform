"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { ExternalLink, Trash2, Pencil, X, CalendarClock, UserRound } from "lucide-react";
import { toast } from "sonner";
import type {
  ContentPiece,
  ContentStatus,
  ContentPlatform,
} from "@/lib/domain/types";
import {
  setContentStatus,
  deleteContent,
  updateContent,
  setContentAuthor,
  type ActionResult,
} from "../actions";

export interface CreatorOption {
  membershipId: string;
  displayName: string;
}

/** Deadline chip meta: null when none, else label + color class. */
function dueMeta(
  dueDate: string | null,
  status: ContentStatus
): { label: string; cls: string } | null {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  const short = due.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  if (status === "published") {
    return { label: short, cls: "text-tc-fg-muted" };
  }
  if (days < 0) {
    return { label: `Venció ${short}`, cls: "text-[hsl(var(--tc-destructive))]" };
  }
  if (days === 0) return { label: "Hoy", cls: "text-[hsl(var(--tc-destructive))]" };
  if (days <= 2) return { label: short, cls: "text-[hsl(var(--tc-amber))]" };
  return { label: short, cls: "text-tc-fg-muted" };
}
import { useActionToast } from "@/lib/use-action-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {};

const PLATFORM_OPTIONS: { value: ContentPlatform; label: string }[] = [
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

const NEXT_STATUS: Partial<Record<ContentStatus, ContentStatus>> = {
  idea: "editing",
  editing: "review",
  review: "published",
};

const NEXT_LABEL: Partial<Record<ContentStatus, string>> = {
  idea: "Empezar edición",
  editing: "Enviar a revisión",
  review: "Publicar",
};

export function ContentCard({
  piece,
  creators = [],
}: {
  piece: ContentPiece;
  creators?: CreatorOption[];
}) {
  const [, formAction, pending] = useActionState(
    setContentStatus,
    initialState
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [editing, setEditing] = useState(false);
  const [reassigning, startReassign] = useTransition();
  const [updateState, updateAction, updating] = useActionState(
    updateContent,
    initialState
  );
  const next = NEXT_STATUS[piece.status];
  const due = dueMeta(piece.dueDate, piece.status);

  function reassign(membershipId: string) {
    startReassign(async () => {
      const res = await setContentAuthor(piece.id, membershipId || null);
      if (res?.error) toast.error(res.error);
    });
  }

  useActionToast(updateState, updating, "Content updated");

  useEffect(() => {
    if (!updating && !updateState.error) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("contentId", piece.id);
      const res = await deleteContent({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Content deleted");
    });
  }

  if (editing) {
    return (
      <form
        action={updateAction}
        className="flex flex-col gap-3 rounded-lg border border-tc-border-strong bg-card p-3"
      >
        <input type="hidden" name="contentId" value={piece.id} />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
            Editar contenido
          </span>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-tc-fg-muted hover:text-tc-fg"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`ct-${piece.id}`}>Título</Label>
          <Input
            id={`ct-${piece.id}`}
            name="title"
            defaultValue={piece.title}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`cp-${piece.id}`}>Plataforma</Label>
          <select
            id={`cp-${piece.id}`}
            name="platform"
            defaultValue={piece.platform}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`cu-${piece.id}`}>Enlace</Label>
          <Input
            id={`cu-${piece.id}`}
            name="url"
            defaultValue={piece.url ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`cd-${piece.id}`}>Fecha límite</Label>
          <input
            id={`cd-${piece.id}`}
            type="date"
            name="dueDate"
            defaultValue={piece.dueDate ?? ""}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          />
        </div>
        {updateState.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]">
            {updateState.error}
          </p>
        )}
        <Button type="submit" disabled={updating} size="sm">
          {updating ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    );
  }

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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={doDelete}
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
            </div>
          ) : (
            <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-tc-fg-muted transition-colors hover:text-tc-fg"
              aria-label="Edit content"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-tc-fg-muted transition-colors hover:text-[hsl(var(--tc-destructive))]"
              aria-label="Delete content"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>
          {PLATFORM_OPTIONS.find((p) => p.value === piece.platform)?.label ??
            piece.platform}
        </Badge>
        {due && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${due.cls}`}
          >
            <CalendarClock className="h-3 w-3" />
            {due.label}
          </span>
        )}
      </div>

      {/* Creator assignment */}
      <label className="flex items-center gap-1.5 text-[11px] text-tc-fg-muted">
        <UserRound className="h-3.5 w-3.5 shrink-0" />
        <select
          value={piece.authorMembershipId ?? ""}
          disabled={reassigning}
          onChange={(e) => reassign(e.target.value)}
          className="w-full rounded-md border border-tc-border bg-input px-2 py-1 text-[11px] text-tc-fg-secondary outline-none focus-visible:border-tc-accent disabled:opacity-60"
          aria-label="Asignar creador"
        >
          <option value="">Sin asignar</option>
          {creators.map((c) => (
            <option key={c.membershipId} value={c.membershipId}>
              {c.displayName}
            </option>
          ))}
          {piece.authorMembershipId &&
            !creators.some((c) => c.membershipId === piece.authorMembershipId) &&
            piece.authorName && (
              <option value={piece.authorMembershipId}>{piece.authorName}</option>
            )}
        </select>
      </label>

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
