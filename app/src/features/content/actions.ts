"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { ContentService } from "./content-service";
import {
  TwitchClient,
  type TwitchVod,
  type TwitchClip,
} from "./twitch-client";
import type { ContentPlatform, ContentStatus } from "@/lib/domain/types";

export type ActionResult = { error?: string };

export type FetchVodsResult =
  | { ok: true; vods: TwitchVod[] }
  | { ok: false; error: string };

export type FetchClipsResult =
  | { ok: true; clips: TwitchClip[] }
  | { ok: false; error: string };

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

/** Fetch recent VODs for a Twitch channel (does not persist anything). */
export async function fetchTwitchVods(
  channel: string
): Promise<FetchVodsResult> {
  const clean = channel.trim();
  if (!clean) return { ok: false, error: "Enter a Twitch channel name." };

  const twitch = new TwitchClient();
  if (!twitch.isConfigured()) {
    return {
      ok: false,
      error: "Twitch is not connected yet. Add server credentials first.",
    };
  }

  const result = await twitch.getChannelVods(clean, 10);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, vods: result.data };
}

/** Import a Twitch VOD as a content piece (status: idea). */
export async function importTwitchVod(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return { error: "Missing VOD data." };

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new ContentService(supabase).createContent(org.orgId, {
    title,
    platform: "twitch",
    url,
    membershipId: null,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}

/**
 * Suggest highlights: a channel's top clips by view count. The community's own
 * most-watched moments act as highlight signals — no video processing needed.
 */
export async function fetchHighlights(
  channel: string,
  days?: number
): Promise<FetchClipsResult> {
  const clean = channel.trim();
  if (!clean) return { ok: false, error: "Enter a Twitch channel name." };

  const twitch = new TwitchClient();
  if (!twitch.isConfigured()) {
    return {
      ok: false,
      error: "Twitch is not connected yet. Add server credentials first.",
    };
  }

  const result = await twitch.getTopClips(clean, 20, days);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, clips: result.data };
}

/** Import a Twitch clip (highlight) as a content piece. */
export async function importTwitchClip(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return { error: "Missing clip data." };

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new ContentService(supabase).createContent(org.orgId, {
    title,
    platform: "twitch",
    url,
    membershipId: null,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}

export async function deleteContent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const contentId = String(formData.get("contentId") ?? "");
  if (!contentId) return { error: "Missing content." };

  const supabase = await createClient();
  const result = await new ContentService(supabase).deleteContent(contentId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}

export async function updateContent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const contentId = String(formData.get("contentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const platform = String(
    formData.get("platform") ?? "other"
  ) as ContentPlatform;
  const url = String(formData.get("url") ?? "").trim() || null;

  if (!contentId) return { error: "Missing content." };
  if (!title) return { error: "Title is required." };
  if (!PLATFORMS.includes(platform)) return { error: "Pick a valid platform." };

  const supabase = await createClient();
  const result = await new ContentService(supabase).updateContent(contentId, {
    title,
    platform,
    url,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/content");
  return {};
}
