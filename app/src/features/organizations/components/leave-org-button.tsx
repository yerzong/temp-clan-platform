"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { leaveOrganization } from "../actions";

/**
 * Lets a non-owner member leave the organization. Owners can't leave, so the
 * button is not rendered for them. Confirms in a centered dialog; on success,
 * the user is sent back to the dashboard (which will prompt to create/join an
 * org since they no longer belong to one).
 */
export function LeaveOrgButton({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function doLeave() {
    start(async () => {
      const fd = new FormData();
      fd.set("orgId", orgId);
      const res = await leaveOrganization({}, fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Abandonaste la organización");
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-tc-fg-secondary"
      >
        <LogOut className="h-4 w-4" />
        Abandonar organización
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={doLeave}
        title="Abandonar organización"
        description={
          <>
            Dejarás de ser miembro de{" "}
            <span className="font-medium text-tc-fg">{orgName}</span>. Perderás
            acceso a sus módulos. Un admin tendrá que invitarte de nuevo para
            volver.
          </>
        }
        confirmLabel="Abandonar"
        destructive
        pending={pending}
      />
    </>
  );
}
