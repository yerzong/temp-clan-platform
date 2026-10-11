"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  /** Optional leading glyph (e.g. a flag emoji). */
  prefix?: string;
  /** Optional trailing hint (e.g. a dial code). */
  hint?: string;
  /** Extra text matched by the search box but not shown. */
  keywords?: string;
}

/**
 * A searchable single-select dropdown — a far nicer replacement for a native
 * <select> when the list is long (countries, dial codes). Keyboard friendly:
 * type to filter, Enter to pick, Escape to close. Closes on outside click.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados.",
  triggerClassName,
  renderValue,
  "aria-label": ariaLabel,
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  triggerClassName?: string;
  /** Custom compact render for the selected value in the trigger. */
  renderValue?: (opt: ComboOption) => React.ReactNode;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.hint ?? ""} ${o.keywords ?? ""} ${o.value}`
        .toLowerCase()
        .includes(q)
    );
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus the search when opening; clear the query on close.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none transition-colors hover:border-tc-border-strong focus-visible:border-tc-accent",
          !selected && "text-tc-fg-muted",
          triggerClassName
        )}
      >
        {selected ? (
          renderValue ? (
            renderValue(selected)
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              {selected.prefix && <span className="shrink-0">{selected.prefix}</span>}
              <span className="truncate">{selected.label}</span>
              {selected.hint && (
                <span className="ml-auto shrink-0 text-tc-fg-muted">{selected.hint}</span>
              )}
            </span>
          )
        ) : (
          <span className="truncate">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-tc-fg-muted" />
      </button>

      {open && (
        <div className="tc-dialog-in absolute z-50 mt-1.5 w-full min-w-[14rem] overflow-hidden rounded-lg border border-tc-border bg-card shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 border-b border-tc-border-soft px-3">
            <Search className="h-4 w-4 shrink-0 text-tc-fg-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  pick(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm text-tc-fg outline-none placeholder:text-tc-fg-muted"
            />
          </div>
          <ul role="listbox" aria-labelledby={listId} className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-tc-fg-muted">{emptyText}</li>
            ) : (
              filtered.map((o, i) => {
                const active = o.value === value;
                return (
                  <li key={`${o.value}-${i}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(o.value)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-[hsl(var(--tc-accent)/0.12)] text-tc-fg"
                          : "text-tc-fg-secondary hover:bg-tc-surface-2"
                      )}
                    >
                      {o.prefix && <span className="shrink-0 text-base leading-none">{o.prefix}</span>}
                      <span className="truncate">{o.label}</span>
                      {o.hint && (
                        <span className="ml-auto shrink-0 text-xs text-tc-fg-muted">{o.hint}</span>
                      )}
                      {active && (
                        <Check className="ml-1 h-4 w-4 shrink-0 text-[hsl(var(--tc-accent-hover))]" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
