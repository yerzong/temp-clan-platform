"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addSlot } from "../actions";

/**
 * A ghost card at the end of the roster grid. Tapping it adds the next slot;
 * because the roster re-renders, this card naturally shifts to the new end.
 */
export function AddSlotCard({ teamId }: { teamId: string }) {
  const [pending, start] = useTransition();

  function add() {
    start(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      const res = await addSlot({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Slot agregado");
    });
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      className="group flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-tc-border bg-transparent text-tc-fg-muted transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-tc-border-strong transition-colors group-hover:border-tc-accent">
        <Plus className="h-6 w-6" />
      </span>
      <span className="text-xs font-medium uppercase tracking-wider">
        {pending ? "Agregando…" : "Agregar slot"}
      </span>
    </button>
  );
}
