"use client";

import { Crown } from "lucide-react";
import type { TeamSlot } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const cleaned = name.replace(/^[.@]+/, "");
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Collectible-style player card (F1/trading-card inspired, tactical COG theme).
 * The slot label reads as the "position" top-left; captain gets an amber crown;
 * a large avatar/initials fill the body; the player name sits big at the base.
 * Empty slots render as a ghost card inviting assignment.
 */
export function PlayerCard({
  slot,
  onEmptyClick,
}: {
  slot: TeamSlot;
  onEmptyClick?: () => void;
}) {
  const filled = Boolean(slot.membershipId);

  if (!filled) {
    return (
      <button
        type="button"
        onClick={onEmptyClick}
        className="group relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-tc-border-strong bg-[hsl(var(--tc-inset))] transition-colors hover:border-tc-accent"
      >
        <span className="absolute left-0 top-3 rounded-r-md bg-tc-surface-3 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-tc-fg-muted">
          {slot.label}
        </span>
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-tc-border-strong text-tc-fg-muted transition-colors group-hover:border-tc-accent group-hover:text-tc-fg">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
            <path
              d="M12 13a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-tc-fg-tertiary transition-colors group-hover:text-tc-fg">
          Asignar jugador
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border bg-gradient-to-b from-tc-surface-2 to-[hsl(var(--tc-canvas))] shadow-lg transition-transform",
        slot.isCaptain
          ? "border-[hsl(var(--tc-amber)/0.5)] shadow-[0_0_24px_-8px_hsl(var(--tc-amber)/0.4)]"
          : "border-tc-border-strong"
      )}
    >
      {/* Tactical grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--tc-fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--tc-fg)) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Position label — top-left, F1 "rating" position */}
      <div className="absolute left-0 top-3 z-10 rounded-r-md bg-[hsl(var(--tc-accent))] px-2.5 py-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[hsl(var(--tc-accent-fg))]">
          {slot.label}
        </span>
      </div>

      {/* Captain crown — top-right */}
      {slot.isCaptain && (
        <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--tc-amber)/0.5)] bg-[hsl(var(--tc-amber)/0.15)] shadow-[0_0_12px_-2px_hsl(var(--tc-amber)/0.6)]">
          <Crown className="h-3.5 w-3.5 text-[hsl(var(--tc-amber))]" />
        </div>
      )}

      {/* Avatar / initials fill the upper body */}
      <div className="relative flex flex-1 items-center justify-center pt-6">
        {slot.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.avatarUrl}
            alt=""
            className="h-28 w-28 rounded-full border-2 border-tc-border object-cover"
          />
        ) : (
          <span className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-tc-border bg-tc-surface-1 font-mono text-3xl font-bold text-tc-fg-secondary">
            {initials(slot.displayName ?? "")}
          </span>
        )}
      </div>

      {/* Name + footer band */}
      <div className="relative z-10 border-t border-tc-border-soft bg-[hsl(var(--tc-canvas)/0.6)] px-3 py-3 backdrop-blur-sm">
        <p className="truncate text-base font-bold uppercase leading-tight tracking-tight text-tc-fg">
          {slot.displayName}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--tc-accent-hover))]">
          {slot.isCaptain ? "Capitán" : "Titular"}
        </p>
      </div>
    </div>
  );
}
