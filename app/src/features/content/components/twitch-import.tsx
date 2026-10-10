"use client";

import { useState, useTransition } from "react";
import { Video, Download, Check } from "lucide-react";
import { fetchTwitchVods, importTwitchVod } from "../actions";
import type { TwitchVod } from "../twitch-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TwitchImport() {
  const [channel, setChannel] = useState("");
  const [vods, setVods] = useState<TwitchVod[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [searching, startSearch] = useTransition();
  const [importing, startImport] = useTransition();

  function search() {
    setError(null);
    startSearch(async () => {
      const res = await fetchTwitchVods(channel);
      if (res.ok) {
        setVods(res.vods);
        if (res.vods.length === 0)
          setError("No se encontraron VODs para ese canal.");
      } else {
        setVods(null);
        setError(res.error);
      }
    });
  }

  function importVod(vod: TwitchVod) {
    startImport(async () => {
      const fd = new FormData();
      fd.set("title", vod.title);
      fd.set("url", vod.url);
      const res = await importTwitchVod({}, fd);
      if (!res.error) {
        setImported((prev) => new Set(prev).add(vod.id));
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="twitch-channel">Canal de Twitch</Label>
        <div className="flex gap-2">
          <Input
            id="twitch-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="ej. shroud"
            autoComplete="off"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <Button
            type="button"
            onClick={search}
            disabled={searching || !channel.trim()}
            className="shrink-0 gap-1.5"
          >
            <Video className="h-4 w-4" />
            {searching ? "..." : "Buscar"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[hsl(var(--tc-destructive))]">{error}</p>
      )}

      {vods && vods.length > 0 && (
        <div className="flex flex-col gap-2">
          {vods.map((vod) => {
            const done = imported.has(vod.id);
            return (
              <div
                key={vod.id}
                className="flex items-center gap-3 rounded-lg border border-tc-border bg-card p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm text-tc-fg">
                    {vod.title}
                  </span>
                  <span className="font-mono text-[11px] text-tc-fg-muted">
                    {formatDuration(vod.durationSeconds)} ·{" "}
                    {vod.publishedAt.slice(0, 10)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant={done ? "ghost" : "outline"}
                  size="sm"
                  disabled={done || importing}
                  onClick={() => importVod(vod)}
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
