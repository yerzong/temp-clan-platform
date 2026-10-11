"use client";

import { useEffect, useState } from "react";

/** Format elapsed ms as "1 h 23 min" / "12 min" / "ahora". */
function formatUptime(ms: number): string {
  if (ms < 60_000) return "ahora";
  const mins = Math.floor(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

/**
 * Ticking "en directo desde" counter. Client-only so it updates without a
 * refetch; the server passes the stream's ISO start time.
 */
export function LiveUptime({ startedAt }: { startedAt: string }) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Render nothing until mounted to avoid a server/client time mismatch.
  if (now === null) return null;
  return <span>En directo · {formatUptime(now - start)}</span>;
}
