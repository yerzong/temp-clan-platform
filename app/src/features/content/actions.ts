"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { ContentService } from "./content-service";
import type { ContentPlatform, ContentStatus } from "@/lib/domain/types";

export type ActionResult = { error?: string };

const PLATFORMS: ContentPlatform[] = ["twitch", "youtube", "tiktok", "other"];
const STATUSES: ContentStatus[] = ["idea", "editing", "review", "published"];

async function resolveOrgId(): Promise<
  { ok: true; orgId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!ctx.data) return { ok: false, error: "You have no organization yet." };
  return { ok: true, orgId: ctx.data.organization.id };
}

export async function createContent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const platform = String(formData.get("platform") ?? "other") as ContentPlatform;
  const url = String(formData.get("url") ?? "").trim() || null;
  const membershipId = String(formData.get("membershipId") ?? "") || null;

  if (!title) return { error: "Title is required." };
  if (!PLATFORMS.includes(platform)) return { error: "Pick a valid platform." };

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new ContentService(supabase).createContent(org.orgId, {
    title,
    platform,
    url,
    membershipId,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}

export async function setContentStatus(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const contentId = String(formData.get("contentId") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatus;

  if (!contentId) return { error: "Missing content." };
  if (!STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const result = await new ContentService(supabase).setStatus(contentId, status);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}
