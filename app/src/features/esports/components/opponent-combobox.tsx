"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronsUpDown, Plus, Search, Swords, X } from "lucide-react";
import { toast } from "sonner";
import type { Opponent } from "@/lib/domain/types";
import { createOpponent } from "@/features/organizations/actions";

type Selected = { id: string | null; name: string } | null;

/**
 * Rival picker for the scheduler: searches the org's registered rivals, and if
 * none match lets you either register a new one (shared across teams) or use the
 * typed name as a one-off. Emits three hidden inputs the event form reads:
 * opponentId, opponent (free text), opponentLabel (display name).
 */
export function OpponentCombobox({
  opponents,
  initial,
}: {
  opponents: Opponent[];
  initial?: Selected;
}) {
  const [selected, setSelected] = useState<Selected>(initial ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, startCreate] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? opponents.filter((o) => o.name.toLowerCase().includes(q))
    : opponents;
  const exact = opponents.some((o) => o.name.toLowerCase() === q);

  function pick(sel: Selected) {
    setSelected(sel);
    setOpen(false);
    setQuery("");
  }

  function registerNew() {
    const name = query.trim();
    if (!name) return;
    startCreate(async () => {
      const res = await createOpponent(name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Rival "${name}" registrado`);
      pick({ id: res.id, name });
    });
  }

  const logoFor = (name: string) =>
    opponents.find((o) => o.name === name && o.id === selected?.id)?.logoUrl ??
    null;

  return (
    <div className="relative" ref={rootRef}>
      {/* Hidden inputs read by the event form */}
      <input type="hidden" name="opponentId" value={selected?.id ?? ""} />
      <input
        type="hidden"
        name="opponent"
        value={selected && !selected.id ? selected.name : ""}
      />
      <input type="hidden" name="opponentLabel" value={selected?.name ?? ""} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              {logoFor(selected.name) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoFor(selected.name)!}
                  alt=""
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <Swords className="h-4 w-4 text-tc-fg-muted" />
              )}
              <span className="truncate">{selected.name}</span>
              {!selected.id && (
                <span className="shrink-0 rounded bg-tc-surface-2 px-1 text-[9px] uppercase text-tc-fg-muted">
                  único
                </span>
              )}
            </>
          ) : (
            <span className="text-tc-fg-muted">Sin rival</span>
          )}
        </span>
        <span className="flex items-center gap-1">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Quitar rival"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(null);
              }}
              className="rounded p-0.5 text-tc-fg-muted hover:text-tc-fg"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 text-tc-fg-muted" />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-tc-border-strong bg-tc-surface-1 shadow-xl">
          <div className="flex items-center gap-2 border-b border-tc-border px-3 py-2">
            <Search className="h-4 w-4 text-tc-fg-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca o escribe un rival…"
              className="w-full bg-transparent text-sm text-tc-fg outline-none placeholder:text-tc-fg-muted"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick({ id: o.id, name: o.name })}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-tc-fg-secondary hover:bg-tc-surface-2"
              >
                {o.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.logoUrl}
                    alt=""
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <Swords className="h-4 w-4 text-tc-fg-muted" />
                )}
                <span className="truncate">{o.name}</span>
              </button>
            ))}

            {q && !exact && (
              <>
                <button
                  type="button"
                  disabled={creating}
                  onClick={registerNew}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[hsl(var(--tc-accent-hover))] hover:bg-tc-surface-2"
                >
                  <Plus className="h-4 w-4" />
                  Registrar rival «{query.trim()}»
                </button>
                <button
                  type="button"
                  onClick={() => pick({ id: null, name: query.trim() })}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-tc-fg-tertiary hover:bg-tc-surface-2"
                >
                  <Swords className="h-4 w-4" />
                  Usar «{query.trim()}» solo esta vez
                </button>
              </>
            )}

            {!q && filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-tc-fg-muted">
                Aún no hay rivales. Escribe uno para registrarlo.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
