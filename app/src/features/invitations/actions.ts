"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService, type InvitableRole } from "./invitation-service";

export type ActionResult = { error?: string };

const INVITABLE_ROLES: InvitableRole[] = ["staff", "creator", "player"];

const EXPIRY_PRESETS: Record<string, number | null> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  never: null,
};

/** Translate the form's role/expiry/uses fields into service inputs. */
function parseConfig(formData: FormData):
  | { ok: true; role: InvitableRole; expiresAt: string | null; maxUses: number | null }
  | { ok: false; error: string } {
  const role = String(formData.get("role") ?? "") as InvitableRole;
  if (!INVITABLE_ROLES.includes(role)) {
    return { ok: false, error: "Selecciona un rol válido." };
  }

  const expiryKey = String(formData.get("expiry") ?? "24h");
  if (!(expiryKey in EXPIRY_PRESETS)) {
    return { ok: false, error: "Expiración inválida." };
  }
  const ms = EXPIRY_PRESETS[expiryKey];
  const expiresAt = ms == null ? null : new Date(Date.now() + ms).toISOString();

  const useMode = String(formData.get("useMode") ?? "single");
  let maxUses: number | null;
  if (useMode === "single") {
    maxUses = 1;
  } else if (useMode === "multi") {
    const limitRaw = String(formData.get("maxUses") ?? "").trim();
    if (limitRaw === "") {
      maxUses = null; // unlimited
    } else {
      const n = Number(limitRaw);
      if (!Number.isInteger(n) || n < 1) {
        return { ok: false, error: "El límite de usos debe ser un número mayor a 0." };
      }
      maxUses = n;
    }
  } else {
    return { ok: false, error: "Modo de uso inválido." };
  }

  return { ok: true, role, expiresAt, maxUses };
}

export async function createInvitation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const cfg = parseConfig(formData);
  if (!cfg.ok) return { error: cfg.error };

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

  const result = await new InvitationService(supabase).createInvitation(
    ctx.data.organization.id,
    {
      role: cfg.role,
      createdBy: user.id,
      expiresAt: cfg.expiresAt,
      maxUses: cfg.maxUses,
    }
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/invitations");
  return {};
}

export async function updateInvitation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) return { error: "Falta la invitación." };

  const cfg = parseConfig(formData);
  if (!cfg.ok) return { error: cfg.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new InvitationService(supabase).updateInvitation(
    invitationId,
    { role: cfg.role, expiresAt: cfg.expiresAt, maxUses: cfg.maxUses }
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
  if (!invitationId) return { error: "Falta la invitación." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new InvitationService(supabase).revokeInvitation(
    invitationId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/invitations");
  return {};
}

export async function deleteInvitation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) return { error: "Falta la invitación." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new InvitationService(supabase).deleteInvitation(
    invitationId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/invitations");
  return {};
}
