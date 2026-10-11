"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  GEARS_DEFAULT_MODES,
  GEARS_DEFAULT_MAPS,
  dedupe,
} from "../gears-defaults";
import { addGameOption } from "@/features/organizations/actions";

/**
 * Mode + maps pickers for the scheduler. Shows the Gears defaults plus any
 * custom values the org added, as selectable chips, with an open field to add
 * new ones on the fly (persisted to the org catalog so they're reusable).
 * Emits hidden inputs: gameMode (single), maps (multiple).
 */
export function MatchParamsFields({
  customModes,
  customMaps,
  initialMode,
  initialMaps,
}: {
  customModes: string[];
  customMaps: string[];
  initialMode: string | null;
  initialMaps: string[];
}) {
  const [modes, setModes] = useState(() =>
    dedupe([...GEARS_DEFAULT_MODES, ...customModes, ...(initialMode ? [initialMode] : [])])
  );
  const [maps, setMaps] = useState(() =>
    dedupe([...GEARS_DEFAULT_MAPS, ...customMaps, ...initialMaps])
  );
  const [mode, setMode] = useState(initialMode ?? "");
  const [selMaps, setSelMaps] = useState<Set<string>>(new Set(initialMaps));
  const [newMode, setNewMode] = useState("");
  const [newMap, setNewMap] = useState("");
  const [pending, start] = useTransition();

  function addMode() {
    const label = newMode.trim();
    if (!label) return;
    start(async () => {
      await addGameOption("mode", label);
      setModes((prev) => dedupe([...prev, label]));
      setMode(label);
      setNewMode("");
    });
  }

  function addMap() {
    const label = newMap.trim();
    if (!label) return;
    start(async () => {
      await addGameOption("map", label);
      setMaps((prev) => dedupe([...prev, label]));
      setSelMaps((prev) => new Set(prev).add(label));
      setNewMap("");
    });
  }

  function toggleMap(m: string) {
    setSelMaps((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  return (
    <>
      {/* Hidden inputs submitted with the form */}
      <input type="hidden" name="gameMode" value={mode} />
      {[...selMaps].map((m) => (
        <input key={m} type="hidden" name="maps" value={m} />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label>Modo (opcional)</Label>
        <div className="flex flex-wrap gap-1.5">
          {modes.map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(active ? "" : m)}
                className={chipClass(active)}
              >
                {m}
              </button>
            );
          })}
        </div>
        <AddInline
          value={newMode}
          onChange={setNewMode}
          onAdd={addMode}
          disabled={pending}
          placeholder="Agregar otro modo…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Mapas (opcional)</Label>
        <div className="flex flex-wrap gap-1.5">
          {maps.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMap(m)}
              className={chipClass(selMaps.has(m))}
            >
              {m}
            </button>
          ))}
        </div>
        <AddInline
          value={newMap}
          onChange={setNewMap}
          onAdd={addMap}
          disabled={pending}
          placeholder="Agregar otro mapa…"
        />
      </div>
    </>
  );
}

function chipClass(active: boolean): string {
  return `rounded-full border px-2.5 py-1 text-xs transition-colors ${
    active
      ? "border-[hsl(var(--tc-accent))] bg-[hsl(var(--tc-accent))]/15 text-[hsl(var(--tc-accent-hover))]"
      : "border-tc-border bg-tc-surface-1 text-tc-fg-secondary hover:border-tc-border-strong"
  }`;
}

function AddInline({
  value,
  onChange,
  onAdd,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-md border border-tc-border bg-input px-2.5 text-xs text-tc-fg outline-none focus-visible:border-tc-accent"
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled || !value.trim()}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-tc-border px-2.5 text-xs text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar
      </button>
    </div>
  );
}
