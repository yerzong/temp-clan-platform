"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteMember } from "../actions";
import { EditMemberForm } from "./edit-member-form";

type RoleVariant = "owner" | "admin" | "staff" | "creator" | "player";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  admin: "Admin",
  staff: "Staff",
  creator: "Creador",
  player: "Jugador",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  invited: "Invitado",
  inactive: "Inactivo",
};

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Operator dossier card. Pure presentation plus two overlay triggers: edit
 * opens a right-side Sheet with the edit form; delete opens a centered
 * ConfirmDialog. The card itself never swaps into an inline form.
 */
export function MemberCard({ member }: { member: Member }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const isOwner = member.role === "owner";

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("membershipId", member.membershipId);
      const res = await deleteMember({}, fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Miembro eliminado");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <div className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-tc-border bg-card p-4 transition-all hover:border-tc-border-strong hover:bg-tc-surface-1">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-0.5 bg-[hsl(var(--tc-accent))] opacity-0 transition-opacity group-hover:opacity-100"
        />

        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2">
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

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate font-medium text-tc-fg">
            {member.displayName}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={member.role as RoleVariant}>
              {ROLE_LABELS[member.role] ?? member.role}
            </Badge>
            {member.isPlayer && <Badge variant="player">jugador</Badge>}
            {member.isCreator && <Badge variant="creator">creador</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-md p-2 text-tc-fg-muted opacity-0 transition-all hover:bg-tc-surface-2 hover:text-tc-fg group-hover:opacity-100"
            aria-label="Editar miembro"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!isOwner && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-md p-2 text-tc-fg-muted opacity-0 transition-all hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))] group-hover:opacity-100"
              aria-label="Eliminar miembro"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <span className="ml-1 font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
            {STATUS_LABELS[member.status] ?? member.status}
          </span>
        </div>
      </div>

      {/* Edit — right-side slide-over */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar miembro"
        description={member.displayName}
      >
        <EditMemberForm member={member} onSuccess={() => setEditOpen(false)} />
      </Sheet>

      {/* Delete — centered confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title="Eliminar miembro"
        description={
          <>
            Vas a eliminar a{" "}
            <span className="font-medium text-tc-fg">
              {member.displayName}
            </span>{" "}
            del roster. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        destructive
        pending={deleting}
      />
    </>
  );
}
