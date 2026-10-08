"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Copy, Check, X } from "lucide-react";
import type { Invitation } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { revokeInvitation, type ActionResult } from "../actions";

type RoleVariant = "owner" | "admin" | "staff" | "creator" | "player";

const initialState: ActionResult = {};

function InviteRow({ invite }: { invite: Invitation }) {
  const [copied, setCopied] = useState(false);
  const [, revokeAction, revoking] = useActionState(
    revokeInvitation,
    initialState
  );

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invite.token}`
      : `/invite/${invite.token}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isPending = invite.status === "pending";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-tc-border bg-card p-3">
      <Badge variant={invite.role as RoleVariant}>{invite.role}</Badge>

      <span className="flex-1 truncate font-mono text-xs text-tc-fg-tertiary">
        /invite/{invite.token.slice(0, 12)}…
      </span>

      {isPending ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <form action={revokeAction}>
            <input type="hidden" name="invitationId" value={invite.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={revoking}
              aria-label="Revoke invitation"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-muted">
          {invite.status}
        </span>
      )}
    </div>
  );
}

export function InviteList({ invitations }: { invitations: Invitation[] }) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        title="No invitations yet"
        description="Generate an invite link to let someone join with their Discord account."
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
