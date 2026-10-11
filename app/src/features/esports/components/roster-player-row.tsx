"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { RosterPlayer } from "@/lib/domain/types";
import { removeFromRoster } from "../actions";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** One roster player with a remove action. */
export function RosterPlayerRow({ player }: { player: RosterPlayer }) {
  const [removing, start] = useTransition();

  function remove() {
    start(async () => {
      const fd = new FormData();
      fd.set("slotId", player.slotId);
      const res = await removeFromRoster({}, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Jugador quitado del roster");
    });
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-tc-border bg-card p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-tc-border bg-tc-surface-2">
        {player.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-[11px] font-semibold text-tc-fg-tertiary">
            {initials(player.displayName)}
          </span>
        )}
      </div>

      <span className="flex-1 truncate text-sm text-tc-fg">
        {player.displayName}
      </span>

      {player.position && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-tc-fg-muted">
          {player.position}
        </span>
      )}

      <button
        type="button"
        onClick={remove}
        disabled={removing}
        aria-label="Quitar del roster"
        className="rounded-md p-1.5 text-tc-fg-muted opacity-0 transition-all hover:bg-tc-surface-2 hover:text-[hsl(var(--tc-destructive))] group-hover:opacity-100 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
