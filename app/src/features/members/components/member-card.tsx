"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/domain/types";
import { useActionToast } from "@/lib/use-action-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateMember,
  deleteMember,
  type ActionResult,
} from "../actions";

type RoleVariant = "owner" | "admin" | "staff" | "creator" | "player";

const initialState: ActionResult = {};

const EDITABLE_ROLES = [
  { value: "staff", label: "Staff" },
  { value: "player", label: "Player" },
  { value: "creator", label: "Creator" },
  { value: "admin", label: "Admin" },
];

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Operator dossier card with inline edit + delete. */
export function MemberCard({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction, updating] = useActionState(
    updateMember,
    initialState
  );
  const [deleting, startDelete] = useTransition();

  useActionToast(updateState, updating, "Member updated");

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("membershipId", member.membershipId);
      const res = await deleteMember({}, fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Member removed");
      }
    });
  }

  // Close the edit form after a successful save.
  useEffect(() => {
    if (!updating && !updateState.error) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);

  const isOwner = member.role === "owner";

  if (editing) {
    return (
      <form
        action={updateAction}
        className="flex flex-col gap-3 rounded-lg border border-tc-border-strong bg-card p-4"
      >
        <input type="hidden" name="membershipId" value={member.membershipId} />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-tertiary">
            Editar miembro
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
          <Label htmlFor={`name-${member.membershipId}`}>Nombre</Label>
          <Input
            id={`name-${member.membershipId}`}
            name="displayName"
            defaultValue={member.displayName}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`role-${member.membershipId}`}>Rol</Label>
          <select
            id={`role-${member.membershipId}`}
            name="role"
            defaultValue={isOwner ? "admin" : member.role}
            disabled={isOwner}
            className="h-10 w-full rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent disabled:opacity-60"
          >
            {isOwner && <option value="owner">Owner</option>}
            {EDITABLE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {isOwner && (
            <p className="text-[11px] text-tc-fg-muted">
              The owner&apos;s role can&apos;t be changed.
            </p>
          )}
        </div>

        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isPlayer"
              defaultChecked={member.isPlayer}
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Player
          </label>
          <label className="flex items-center gap-2 text-sm text-tc-fg-secondary">
            <input
              type="checkbox"
              name="isCreator"
              defaultChecked={member.isCreator}
              className="h-4 w-4 accent-[hsl(var(--tc-accent))]"
            />
            Creator
          </label>
        </div>

        {updateState.error && (
          <p className="text-sm text-[hsl(var(--tc-destructive))]">
            {updateState.error}
          </p>
        )}

        <Button type="submit" disabled={updating} size="sm">
          {updating ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    );
  }

  return (
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-tc-border bg-card p-4 transition-all hover:border-tc-border-strong hover:bg-tc-surface-1">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-[hsl(var(--tc-accent))] opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-sm font-semibold text-tc-fg-tertiary">
            {initials(member.displayName)}
          </span>
        )}
        {member.status === "active" && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[hsl(var(--tc-success))]" />
        )}
      </div>

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

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-tc-fg-tertiary">¿Eliminar?</span>
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
              disabled={deleting}
            >
              No
            </Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md p-2 text-tc-fg-muted opacity-0 transition-all hover:bg-tc-surface-2 hover:text-tc-fg group-hover:opacity-100"
              aria-label="Editar miembro"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {!isOwner && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md p-2 text-tc-fg-muted opacity-0 transition-all hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))] group-hover:opacity-100"
                aria-label="Eliminar miembro"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <span className="ml-1 font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
              {member.status}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
