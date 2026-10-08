"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService } from "./invitation-service";
import type { MemberRole } from "@/lib/domain/types";

export type ActionResult = { error?: string };

const VALID_ROLES: MemberRole[] = ["admin", "staff", "creator", "player"];

export async function createInvitation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const role = String(formData.get("role") ?? "") as MemberRole;
  if (!VALID_ROLES.includes(role)) return { error: "Select a valid role." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  if (!ctx.ok) return { error: ctx.error };
  if (!ctx.data) return { error: "You have no organization yet." };

  const result = await new InvitationService(supabase).createInvitation(
    ctx.data.organization.id,
    role,
    user.id
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/invitations");
  return {};
}

export async function revokeInvitation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) return { error: "Missing invitation." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const result = await new InvitationService(supabase).revokeInvitation(
    invitationId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/invitations");
  return {};
}
