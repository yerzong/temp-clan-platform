"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { Invitation } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { InviteList } from "./invite-list";
import { InviteConfigForm } from "./invite-config-form";

/**
 * Client container for invitations: a "create invitation" button that opens a
 * right-side slide-over with the config form, plus the list of existing links.
 */
export function InviteManager({ invitations }: { invitations: Invitation[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
          Enlaces de invitación
        </h2>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Crear invitación
        </Button>
      </div>

      <InviteList invitations={invitations} />

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Crear invitación"
        description="Configura el rol, los usos y la expiración del enlace."
      >
        <InviteConfigForm onSuccess={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
