import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, Result } from "@/lib/domain/types";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Notification service — reads the current user's notifications and marks them
 * read. Rows are written only by DB functions (e.g. redeem_invitation), never
 * directly by clients.
 */
export class NotificationService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** The current user's notifications, newest first. */
  async list(limit = 30): Promise<Result<AppNotification[]>> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("id, type, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, error: error.message };

    const items: AppNotification[] = (data ?? []).map((r) => {
      const row = r as NotificationRow;
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        readAt: row.read_at,
        createdAt: row.created_at,
      };
    });

    return { ok: true, data: items };
  }

  /** Mark all of the current user's notifications as read. */
  async markAllRead(): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("mark_notifications_read");
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }
}
