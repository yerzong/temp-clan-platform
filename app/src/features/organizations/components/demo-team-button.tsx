"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedDemoTeam } from "../actions";

/** One-click: create a demo team with 5 fully-profiled players. */
export function DemoTeamButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  function create() {
    start(async () => {
      const res = await seedDemoTeam();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Equipo de ejemplo creado");
      router.push(`/dashboard/esports/${res.id}`);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        onClick={create}
        disabled={pending}
        variant="outline"
        className="gap-1.5"
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Creando..." : "Crear equipo de ejemplo"}
      </Button>
      <p className="text-[11px] text-tc-fg-muted">
        Crea un equipo con 5 jugadores de perfil completo y avatares generados,
        para probar la plataforma. Puedes eliminarlo cuando quieras.
      </p>
    </div>
  );
}
