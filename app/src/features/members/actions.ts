"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "./member-service";

export type ActionResult = { error?: string };

function readFunctions(formData: FormData) {
  return {
    displayName: String(formData.get("displayName") ?? "").trim(),
    isStaff: formData.get("isStaff") === "on",
    isPlayer: formData.get("isPlayer") === "on",
    isCreator: formData.get("isCreator") === "on",
    isAdmin: formData.get("isAdmin") === "on",
  };
}

/** Add a manual member (roster entry) with functions + admin permission. */
export async function addMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const fns = readFunctions(formData);
  if (!fns.displayName) return { error: "El nombre es obligatorio." };
  // Admin is exclusive and replaces functions, so an admin needs no function.
  if (!fns.isAdmin && !fns.isStaff && !fns.isPlayer && !fns.isCreator) {
    return { error: "Elige al menos una función o marca Administrador." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  if (!ctx.ok) return { error: ctx.error };
  if (!ctx.data) return { error: "Aún no tienes una organización." };

  const result = await new MemberService(supabase).addMember(
    ctx.data.organization.id,
    fns
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  return {};
}

/** Update a member's name, functions and admin permission. */
export async function updateMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return { error: "Falta el miembro." };

  const fns = readFunctions(formData);
  if (!fns.displayName) return { error: "El nombre es obligatorio." };
  // Admin is exclusive and replaces functions, so an admin needs no function.
  if (!fns.isAdmin && !fns.isStaff && !fns.isPlayer && !fns.isCreator) {
    return { error: "Elige al menos una función o marca Administrador." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new MemberService(supabase).updateMember(
    membershipId,
    fns
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/members");
  return {};
}

/** Admin edits a member's full profile (contact + identity). */
export async function updateMemberProfile(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return { error: "Falta el miembro." };

  const dial = String(formData.get("phoneDial") ?? "").trim();
  const localNum = String(formData.get("phoneNumber") ?? "").trim();
  const phone = localNum ? `${dial} ${localNum}`.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new MemberService(supabase).updateMemberProfile(
    membershipId,
    {
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      birthDate: String(formData.get("birthDate") ?? "") || null,
      nationality: String(formData.get("nationality") ?? "").trim(),
      phone,
      avatarUrl: String(formData.get("avatarUrl") ?? "").trim(),
    }
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/members");
  return {};
}

/** Remove a member from the organization. */
export async function deleteMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return { error: "Falta el miembro." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new MemberService(supabase).deleteMember(membershipId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  return {};
}
