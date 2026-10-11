"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Invitation, InvitationState } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InviteConfigForm } from "./invite-config-form";
import { deleteInvitation } from "../actions";

type RoleVariant = "owner" | "admin" | "staff" | "creator" | "player";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  admin: "Admin",
  staff: "Staff",
  creator: "Creador",
  player: "Jugador",
};

const STATE_META: Record<
  InvitationState,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className:
      "border-[hsl(var(--tc-success)/0.3)] bg-[hsl(var(--tc-success)/0.12)] text-[hsl(var(--tc-success))]",
  },
  expired: {
    label: "Expirada",
    className: "border-tc-border bg-tc-surface-2 text-tc-fg-muted",
  },
  exhausted: {
    label: "Agotada",
    className: "border-tc-border bg-tc-surface-2 text-tc-fg-muted",
  },
  revoked: {
    label: "Revocada",
    className:
      "border-[hsl(var(--tc-destructive)/0.3)] bg-[hsl(var(--tc-destructive)/0.1)] text-[hsl(var(--tc-destructive))]",
  },
  accepted: {
    label: "Usada",
    className: "border-tc-border bg-tc-surface-2 text-tc-fg-tertiary",
  },
};

function usesLabel(inv: Invitation): string {
  if (inv.maxUses == null) return `${inv.useCount} usos · ilimitado`;
  return `${inv.useCount} / ${inv.maxUses} usos`;
}

function expiryLabel(inv: Invitation): string {
  if (!inv.expiresAt) return "Sin expiración";
  const d = new Date(inv.expiresAt);
  const now = Date.now();
  if (d.getTime() < now) return "Expiró";
  const hours = Math.round((d.getTime() - now) / (60 * 60 * 1000));
  if (hours < 24) return `Expira en ${hours}h`;
  const days = Math.round(hours / 24);
  return `Expira en ${days}d`;
}

function InviteRow({ invite }: { invite: Invitation }) {
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invite.token}`
      : `/invite/${invite.token}`;

  const meta = STATE_META[invite.state];
  const canShare = invite.state === "active";

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 1500);
  }

  function doDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("invitationId", invite.id);
      const res = await deleteInvitation({}, fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Invitación eliminada");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-tc-border bg-card p-3">
        <Badge variant={invite.role as RoleVariant}>
          {ROLE_LABELS[invite.role] ?? invite.role}
        </Badge>

        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.className}`}
        >
          {meta.label}
        </span>

        <span className="font-mono text-[11px] text-tc-fg-tertiary">
          {usesLabel(invite)}
        </span>
        <span className="text-[11px] text-tc-fg-muted">
          {expiryLabel(invite)}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {canShare && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          )}
          {invite.state === "active" && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Editar invitación"
              className="rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Eliminar invitación"
            className="rounded-md p-2 text-tc-fg-muted transition-colors hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar invitación"
        description="Ajusta el rol, los usos o la expiración."
      >
        <InviteConfigForm invite={invite} onSuccess={() => setEditOpen(false)} />
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        title="Eliminar invitación"
        description="El enlace dejará de funcionar de inmediato. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        pending={deleting}
      />
    </>
  );
}

export function InviteList({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        title="Aún no hay invitaciones"
        description="Crea un enlace de invitación para que la gente se una con su cuenta de Discord."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {invitations.map((inv) => (
        <InviteRow key={inv.id} invite={inv} />
      ))}
    </div>
  );
}
