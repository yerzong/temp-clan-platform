"use client";

import { useTransition } from "react";
import { UserPlus2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fillTeamDemo } from "../actions";

/** Admin shortcut: fill the team's empty slots with demo players. */
export function FillTeamButton({ teamId }: { teamId: string }) {
  const [pending, start] = useTransition();

  function fill() {
    start(async () => {
      const res = await fillTeamDemo(teamId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.created > 0
          ? `${res.created} jugador(es) agregados`
          : "No había slots vacíos"
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={fill}
      disabled={pending}
      className="gap-1.5"
    >
      <UserPlus2 className="h-4 w-4" />
      {pending ? "Rellenando..." : "Rellenar con ejemplo"}
    </Button>
  );
}
