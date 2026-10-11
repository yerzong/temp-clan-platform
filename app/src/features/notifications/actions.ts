"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "./notification-service";

export type ActionResult = { error?: string };

/** Mark all of the current user's notifications as read. */
export async function markNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new NotificationService(supabase).markAllRead();
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}
