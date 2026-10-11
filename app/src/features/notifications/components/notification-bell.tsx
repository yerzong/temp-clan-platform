"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, Inbox } from "lucide-react";
import type { AppNotification } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { markNotificationsRead } from "../actions";

/** Short relative time in Spanish: "hace 3 h", "hace 2 d", "ahora". */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Top-bar notification bell. Seeds from a server-provided list, then subscribes
 * to Supabase Realtime so new notifications arrive live (no page reload).
 * Shows an unread count and a dropdown; opening it marks everything read.
 */
export function NotificationBell({
  notifications: initial,
  userId,
}: {
  notifications: AppNotification[];
  userId: string;
}) {
  const [items, setItems] = useState<AppNotification[]>(initial);
  const [open, setOpen] = useState(false);
  const [, startRead] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.readAt).length;

  // Live updates via Realtime: listen for new notifications for this user.
  // RLS-protected tables require the socket to carry the user's access token,
  // so we set it on the realtime client before subscribing.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    function addRow(row: NotificationRow) {
      setItems((prev) => {
        if (prev.some((n) => n.id === row.id)) return prev;
        return [
          {
            id: row.id,
            type: row.type,
            title: row.title,
            body: row.body,
            readAt: row.read_at,
            createdAt: row.created_at,
          },
          ...prev,
        ];
      });
    }

    (async () => {
      // Authenticate the realtime socket with the current session token.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      channel = supabase
        .channel(`notifications:${userId}`, {
          config: { private: false },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => addRow(payload.new as NotificationRow)
        )
        .subscribe((status) => {
          // Visible in the browser console to confirm the subscription state.
          console.log("[notifications] realtime status:", status);
        });
    })();

    // Keep the socket token fresh across auth refreshes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  // Mark read when the panel opens with unread items.
  useEffect(() => {
    if (open && unread > 0) {
      startRead(async () => {
        await markNotificationsRead();
      });
      // Optimistically clear unread locally.
      setItems((prev) =>
        prev.map((n) =>
          n.readAt ? n : { ...n, readAt: new Date().toISOString() }
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-tc-fg-tertiary transition-colors hover:bg-tc-surface-2 hover:text-tc-fg"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--tc-accent))] px-1 text-[10px] font-semibold text-[hsl(var(--tc-accent-fg))]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="tc-animate-in absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-lg border border-tc-border-strong bg-tc-surface-1 shadow-2xl">
          <div className="border-b border-tc-border px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tc-fg-secondary">
              Notificaciones
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-5 w-5 text-tc-fg-muted" />
                <p className="text-sm text-tc-fg-tertiary">
                  Sin notificaciones todavía.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-tc-border-soft px-4 py-3 last:border-b-0",
                    !n.readAt && "bg-[hsl(var(--tc-accent)/0.05)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-tc-fg">
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-tc-fg-muted">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <span className="text-xs text-tc-fg-tertiary">{n.body}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
