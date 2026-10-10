"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import type { Member } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { MembersRoster, type RoleFilter } from "./members-roster";
import { AddMemberForm } from "./add-member-form";

const FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "staff", label: "Staff" },
  { key: "players", label: "Jugadores" },
  { key: "creators", label: "Creadores" },
];

/**
 * Client container for the members roster: live search, role filter chips, and
 * an "add member" button that opens a right-side slide-over with the form.
 */
export function MembersManager({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [members, query]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar: search + filters + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tc-fg-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-9 pr-9"
            aria-label="Buscar miembros"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-tc-fg-muted transition-colors hover:text-tc-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button onClick={() => setOpen(true)} className="gap-2 sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Agregar miembro
        </Button>
      </div>

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                active
                  ? "border-tc-accent bg-[hsl(var(--tc-accent)/0.12)] text-[hsl(var(--tc-accent-hover))]"
                  : "border-tc-border text-tc-fg-tertiary hover:border-tc-border-strong hover:text-tc-fg-secondary"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Roster */}
      <MembersRoster
        members={filtered}
        filter={filter}
        emptyTitle={
          hasQuery ? "Sin resultados" : "Sin operadores desplegados"
        }
        emptyDescription={
          hasQuery
            ? `Ningún miembro coincide con “${query.trim()}”.`
            : "Agrega tu primer miembro de staff, jugador o creador con el botón de arriba."
        }
      />

      {/* Add-member slide-over */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Agregar miembro"
        description="Registra staff, jugadores o creadores en tu organización."
      >
        <AddMemberForm onSuccess={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
