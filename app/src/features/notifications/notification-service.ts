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

function toNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

const SELECT = "id, type, title, body, read_at, created_at";

/**
 * Notification service. The bell panel shows non-dismissed notifications; the
 * log page shows all of them. Rows are written only by DB functions; the user
 * can dismiss (hide from panel) or delete (remove from log) their own.
 */
export class NotificationService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** Non-dismissed notifications for the bell panel, newest first. */
  async list(limit = 30): Promise<Result<AppNotification[]>> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select(SELECT)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []).map((r) => toNotification(r as NotificationRow)) };
  }

  /** All notifications (the log / bitácora), newest first. */
  async listAll(limit = 200): Promise<Result<AppNotification[]>> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []).map((r) => toNotification(r as NotificationRow)) };
  }

  /** Mark all of the current user's notifications as read. */
  async markAllRead(): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("mark_notifications_read");
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Hide a single notification from the bell panel (keeps it in the log). */
  async dismiss(id: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("dismiss_notification", {
      notif_id: id,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Hide all notifications from the bell panel. */
  async dismissAll(): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("dismiss_all_notifications");
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Permanently delete a single notification from the log. */
  async delete(id: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_notification", {
      notif_id: id,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Permanently delete all of the current user's notifications. */
  async deleteAll(): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_all_notifications");
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }
}
