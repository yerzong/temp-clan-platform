"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "./notification-service";

export type ActionResult = { error?: string };

async function withService(): Promise<
  { ok: true; service: NotificationService } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };
  return { ok: true, service: new NotificationService(supabase) };
}

/** Mark all of the current user's notifications as read. */
export async function markNotificationsRead(): Promise<ActionResult> {
  const s = await withService();
  if (!s.ok) return { error: s.error };
  const result = await s.service.markAllRead();
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard");
  return {};
}

/** Hide one notification from the bell panel (stays in the log). */
export async function dismissNotification(id: string): Promise<ActionResult> {
  const s = await withService();
  if (!s.ok) return { error: s.error };
  const result = await s.service.dismiss(id);
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard");
  return {};
}

/** Hide all notifications from the bell panel. */
export async function dismissAllNotifications(): Promise<ActionResult> {
  const s = await withService();
  if (!s.ok) return { error: s.error };
  const result = await s.service.dismissAll();
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard");
  return {};
}

/** Permanently delete one notification from the log. */
export async function deleteNotification(id: string): Promise<ActionResult> {
  const s = await withService();
  if (!s.ok) return { error: s.error };
  const result = await s.service.delete(id);
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard/notifications");
  return {};
}

/** Permanently delete all of the current user's notifications. */
export async function deleteAllNotifications(): Promise<ActionResult> {
  const s = await withService();
  if (!s.ok) return { error: s.error };
  const result = await s.service.deleteAll();
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard/notifications");
  return {};
}
