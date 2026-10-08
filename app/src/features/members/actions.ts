"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "./member-service";
import type { MemberRole } from "@/lib/domain/types";

export type ActionResult = { error?: string };

const VALID_ROLES: MemberRole[] = [
  "owner",
  "admin",
  "staff",
  "creator",
  "player",
];

/** Add a manual member (roster entry) to the current user's organization. */
export async function addMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as MemberRole;
  const isCreator = formData.get("isCreator") === "on";
  const isPlayer = formData.get("isPlayer") === "on";

  if (!displayName) return { error: "Member name is required." };
  if (!VALID_ROLES.includes(role)) return { error: "Select a valid role." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const orgService = new OrganizationService(supabase);
  const ctx = await orgService.getCurrentOrgContext(user.id);
  if (!ctx.ok) return { error: ctx.error };
  if (!ctx.data) return { error: "You have no organization yet." };

  const memberService = new MemberService(supabase);
  const result = await memberService.addMember(ctx.data.organization.id, {
    displayName,
    role,
    isCreator,
    isPlayer,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}

/** Update an existing member's role and attributes. */
export async function updateMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as MemberRole;
  const isCreator = formData.get("isCreator") === "on";
  const isPlayer = formData.get("isPlayer") === "on";

  if (!membershipId) return { error: "Missing member." };
  if (!displayName) return { error: "Member name is required." };
  if (!VALID_ROLES.includes(role)) return { error: "Select a valid role." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const result = await new MemberService(supabase).updateMember(membershipId, {
    displayName,
    role,
    isCreator,
    isPlayer,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}

/** Remove a member from the organization. */
export async function deleteMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return { error: "Missing member." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const result = await new MemberService(supabase).deleteMember(membershipId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}
