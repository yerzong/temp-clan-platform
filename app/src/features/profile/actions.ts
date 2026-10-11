"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { ProfileService } from "./profile-service";
import type { MemberProfile } from "@/lib/domain/types";

export type ActionResult = { error?: string };

/** Fetch a member's full profile (for the player-detail view modal). */
export async function fetchPlayerProfile(
  membershipId: string
): Promise<{ ok: true; profile: MemberProfile | null } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  const res = await new ProfileService(supabase).getProfile(membershipId);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, profile: res.data };
}

async function orgId(): Promise<
  { ok: true; orgId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };
  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!ctx.data) return { ok: false, error: "No tienes organización." };
  return { ok: true, orgId: ctx.data.organization.id };
}

/** Update the current user's own profile fields. */
export async function updateMyProfile(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const org = await orgId();
  if (!org.ok) return { error: org.error };

  // Combine dial code + local number into a single phone string.
  const dial = String(formData.get("phoneDial") ?? "").trim();
  const localNum = String(formData.get("phoneNumber") ?? "").trim();
  const phone = localNum ? `${dial} ${localNum}`.trim() : "";

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_org: org.orgId,
    p_display_name: String(formData.get("displayName") ?? "").trim(),
    p_username: String(formData.get("username") ?? "").trim(),
    p_birth_date: String(formData.get("birthDate") ?? "") || null,
    p_nationality: String(formData.get("nationality") ?? "").trim(),
    p_phone: phone,
    p_avatar_url: String(formData.get("avatarUrl") ?? "").trim(),
    p_privacy_accepted: formData.get("privacy") === "on",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/members");
  return {};
}

/** Add or update one of my linked accounts (social or game). */
export async function upsertMyAccount(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const org = await orgId();
  if (!org.ok) return { error: org.error };

  const platform = String(formData.get("platform") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();
  if (!platform) return { error: "Elige una plataforma." };
  if (!handle) return { error: "El usuario/ID es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_my_account", {
    p_org: org.orgId,
    p_platform: platform,
    p_kind: String(formData.get("kind") ?? "social"),
    p_handle: handle,
    p_url: String(formData.get("url") ?? "").trim(),
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  return {};
}

/** Remove one of my linked accounts. */
export async function deleteMyAccount(accountId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase.rpc("delete_my_account", {
    p_account_id: accountId,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  return {};
}

/** Admin verifies/unverifies a member's account. */
export async function setAccountVerified(
  accountId: string,
  verified: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase.rpc("set_account_verified", {
    p_account_id: accountId,
    p_verified: verified,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  return {};
}
