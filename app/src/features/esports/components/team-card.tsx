"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { Team } from "@/lib/domain/types";
import { updateTeam, deleteTeam, type ActionResult } from "../actions";
import { useActionToast } from "@/lib/use-action-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stat } from "@/components/ui/stat";

const initialState: ActionResult = {};

const FORMATS = [
  { value: "versus-4v4", label: "Versus 4v4" },
  { value: "horde-siege", label: "Horde Siege" },
];

export function TeamCard({ team }: { team: Team }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction, updating] = useActionState(
    updateTeam,
    initialState
  );
  const [deleting, startDelete] = useTransition();

  useActionToast(updateState, updating, "Team updated");

  useEffect(() => {
    if (!updating && !updateState.error) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("teamId", team.id);
      const res = await deleteTeam({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Team deleted");
    });
  }

  if (editing) {
    return (
      <form
        action={updateAction}
        className="flex flex-col gap-3 rounded-lg border border-tc-border-strong bg-card p-4"
      >
        <input type="hidden" name="teamId" value={team.id} />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
            Edit team
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
          <Label htmlFor={`tname-${team.id}`}>Name</Label>
          <Input
            id={`tname-${team.id}`}
            name="name"
            defaultValue={team.name}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`tfmt-${team.id}`}>Format</Label>
          <select
            id={`tfmt-${team.id}`}
            name="format"
            defaultValue={team.format}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {updateState.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]">
            {updateState.error}
          </p>
        )}
        <Button type="submit" disabled={updating} size="sm">
          {updating ? "Saving..." : "Save changes"}
        </Button>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-tc-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-tc-fg">{team.name}</span>
          <Badge>{team.format}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="Roster" value={team.rosterCount} />
          {confirmingDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-tc-fg-tertiary">Delete?</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={doDelete}
              >
                {deleting ? "..." : "Yes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
                aria-label="Edit team"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
                aria-label="Delete team"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {team.roster.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-tc-border-soft pt-3">
          {team.roster.map((p) => (
            <span
              key={p.slotId}
              className="inline-flex items-center gap-1.5 rounded border border-tc-border bg-tc-surface-2 px-2 py-1 text-xs text-tc-fg-secondary"
            >
              {p.displayName}
              {p.position && (
                <span className="font-mono text-[10px] uppercase text-tc-fg-muted">
                  {p.position}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
