"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { CreateTeamForm } from "./create-team-form";

/** "Crear equipo" button that opens a right-side slide-over with the form. */
export function CreateTeamPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Crear equipo
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Crear equipo"
        description="Arma un nuevo squad para tu organización."
      >
        <CreateTeamForm onSuccess={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
