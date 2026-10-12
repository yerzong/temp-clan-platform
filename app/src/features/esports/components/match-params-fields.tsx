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

const DEFAULT_SIZES = ["1v1", "2v2", "3v3", "4v4", "5v5"];
const DEFAULT_FORMATS = ["Bo1", "Bo3", "Bo5"];

/**
 * Match setup for the scheduler: team size, game mode, series format and the
 * map pool — all as selectable chips with an open field to add values on the
 * fly. Modes/maps persist to the org catalog (reusable); size/format are free.
 * Emits hidden inputs: teamSize, gameMode, seriesFormat, maps (multiple).
 */
export function MatchParamsFields({
  customModes,
  customMaps,
  initialMode,
  initialMaps,
  initialTeamSize,
  initialSeriesFormat,
}: {
  customModes: string[];
  customMaps: string[];
  initialMode: string | null;
  initialMaps: string[];
  initialTeamSize: string | null;
  initialSeriesFormat: string | null;
}) {
  const [sizes, setSizes] = useState(() =>
    dedupe([...DEFAULT_SIZES, ...(initialTeamSize ? [initialTeamSize] : [])])
  );
  const [size, setSize] = useState(initialTeamSize ?? "");
  const [formats, setFormats] = useState(() =>
    dedupe([...DEFAULT_FORMATS, ...(initialSeriesFormat ? [initialSeriesFormat] : [])])
  );
  const [format, setFormat] = useState(initialSeriesFormat ?? "");
  const [modes, setModes] = useState(() =>
    dedupe([...GEARS_DEFAULT_MODES, ...customModes, ...(initialMode ? [initialMode] : [])])
  );
  const [mode, setMode] = useState(initialMode ?? "");
  const [maps, setMaps] = useState(() =>
    dedupe([...GEARS_DEFAULT_MAPS, ...customMaps, ...initialMaps])
  );
  const [selMaps, setSelMaps] = useState<Set<string>>(new Set(initialMaps));
  const [pending, start] = useTransition();

  function addMode(label: string) {
    start(async () => {
      await addGameOption("mode", label);
      setModes((prev) => dedupe([...prev, label]));
      setMode(label);
    });
  }
  function addMap(label: string) {
    start(async () => {
      await addGameOption("map", label);
      setMaps((prev) => dedupe([...prev, label]));
      setSelMaps((prev) => new Set(prev).add(label));
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
      <input type="hidden" name="teamSize" value={size} />
      <input type="hidden" name="gameMode" value={mode} />
      <input type="hidden" name="seriesFormat" value={format} />
      {[...selMaps].map((m) => (
        <input key={m} type="hidden" name="maps" value={m} />
      ))}

      <SingleChips
        label="Tamaño de equipo"
        options={sizes}
        value={size}
        onPick={(v) => setSize(size === v ? "" : v)}
        onAdd={(v) => {
          setSizes((prev) => dedupe([...prev, v]));
          setSize(v);
        }}
        placeholder="Ej. 6v6"
      />

      <SingleChips
        label="Modo de juego"
        options={modes}
        value={mode}
        onPick={(v) => setMode(mode === v ? "" : v)}
        onAdd={addMode}
        disabled={pending}
        placeholder="Agregar otro modo…"
      />

      <SingleChips
        label="Formato"
        options={formats}
        value={format}
        onPick={(v) => setFormat(format === v ? "" : v)}
        onAdd={(v) => {
          setFormats((prev) => dedupe([...prev, v]));
          setFormat(v);
        }}
        placeholder="Ej. Bo7"
      />

      <div className="flex flex-col gap-1.5">
        <Label>Mapas / map pool (opcional)</Label>
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
        <AddInline onAdd={addMap} disabled={pending} placeholder="Agregar otro mapa…" />
      </div>
    </>
  );
}

function SingleChips({
  label,
  options,
  value,
  onPick,
  onAdd,
  disabled,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string;
  onPick: (v: string) => void;
  onAdd: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label} (opcional)</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className={chipClass(value === o)}
          >
            {o}
          </button>
        ))}
      </div>
      <AddInline onAdd={onAdd} disabled={disabled} placeholder={placeholder} />
    </div>
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
  onAdd,
  disabled,
  placeholder,
}: {
  onAdd: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  function commit() {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  }
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-md border border-tc-border bg-input px-2.5 text-xs text-tc-fg outline-none focus-visible:border-tc-accent"
      />
      <button
        type="button"
        onClick={commit}
        disabled={disabled || !value.trim()}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-tc-border px-2.5 text-xs text-tc-fg-secondary transition-colors hover:border-tc-accent hover:text-tc-fg disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar
      </button>
    </div>
  );
}
