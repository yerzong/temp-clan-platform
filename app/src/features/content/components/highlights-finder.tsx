"use client";

import { useState, useTransition } from "react";
import { Flame, Download, Check, Eye } from "lucide-react";
import { fetchHighlights, importTwitchClip } from "../actions";
import type { TwitchClip } from "../twitch-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RANGES = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 0, label: "Todo" },
];

function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function HighlightsFinder() {
  const [channel, setChannel] = useState("");
  const [days, setDays] = useState(30);
  const [clips, setClips] = useState<TwitchClip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [searching, startSearch] = useTransition();
  const [importing, startImport] = useTransition();

  function search() {
    setError(null);
    startSearch(async () => {
      const res = await fetchHighlights(channel, days || undefined);
      if (res.ok) {
        setClips(res.clips);
        if (res.clips.length === 0)
          setError("No se encontraron clips para ese canal/rango.");
      } else {
        setClips(null);
        setError(res.error);
      }
    });
  }

  function importClip(clip: TwitchClip) {
    startImport(async () => {
      const fd = new FormData();
      fd.set("title", clip.title);
      fd.set("url", clip.url);
      const res = await importTwitchClip({}, fd);
      if (!res.error) setImported((prev) => new Set(prev).add(clip.id));
      else setError(res.error);
    });
  }

  // Max views to show a relative "heat" bar — highlight strength signal.
  const maxViews = clips?.reduce((m, c) => Math.max(m, c.viewCount), 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="hl-channel">Canal de Twitch</Label>
          <Input
            id="hl-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="ej. shroud"
            autoComplete="off"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hl-range">Rango</Label>
          <select
            id="hl-range"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-md border border-tc-border bg-input px-3 text-sm text-tc-fg outline-none focus-visible:border-tc-accent"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={search}
          disabled={searching || !channel.trim()}
          className="shrink-0 gap-1.5"
        >
          <Flame className="h-4 w-4" />
          {searching ? "..." : "Buscar highlights"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]">{error}</p>
      )}

      {clips && clips.length > 0 && (
        <div className="flex flex-col gap-2">
          {clips.map((clip, i) => {
            const done = imported.has(clip.id);
            const heat = maxViews > 0 ? (clip.viewCount / maxViews) * 100 : 0;
            return (
              <div
                key={clip.id}
                className="flex items-center gap-3 rounded-lg border border-tc-border bg-card p-3"
              >
                <span className="w-5 shrink-0 text-center font-mono text-xs text-tc-fg-muted">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm text-tc-fg">
                    {clip.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-tc-fg-muted">
                      <Eye className="h-3 w-3" />
                      {compactNumber(clip.viewCount)}
                    </span>
                    {/* highlight heat bar */}
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-tc-surface-3">
                      <span
                        className="block h-full bg-[hsl(var(--tc-accent))]"
                        style={{ width: `${heat}%` }}
                      />
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={done ? "ghost" : "outline"}
                  size="sm"
                  disabled={done || importing}
                  onClick={() => importClip(clip)}
                  className="shrink-0 gap-1.5"
                >
                  {done ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Agregado
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" /> Importar
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
