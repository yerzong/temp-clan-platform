"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "./organization-service";

export type ActionResult = { error?: string };

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Create the current user's organization (they become owner). */
export async function createOrganization(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? ""));

  if (!name) return { error: "Organization name is required." };
  if (!slug) return { error: "A valid slug is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const service = new OrganizationService(supabase);
  const result = await service.createOrganization(name, slug);

  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}

/** The current user leaves their organization. */
export async function leaveOrganization(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return { error: "Falta la organización." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const result = await new OrganizationService(supabase).leaveOrganization(
    orgId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}

// --- Rivals, catalog, settings & demo team ----------------------------------

type OkId = { ok: true; id: string } | { ok: false; error: string };
type Ok = { ok: true } | { ok: false; error: string };

/** Resolve the current user's org id, or an error. */
async function resolveOrgId(): Promise<
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

const SETTINGS_PATH = "/dashboard/settings";

/** Create a rival (or return the existing one by name). */
export async function createOpponent(
  name: string,
  logoUrl: string | null = null
): Promise<OkId> {
  if (!name.trim()) return { ok: false, error: "El rival necesita un nombre." };
  const org = await resolveOrgId();
  if (!org.ok) return { ok: false, error: org.error };

  const supabase = await createClient();
  const res = await new OrganizationService(supabase).upsertOpponent(
    org.orgId,
    name,
    logoUrl
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/esports", "layout");
  return { ok: true, id: res.data };
}

/** Rename / re-logo a rival. */
export async function updateOpponent(
  id: string,
  name: string,
  logoUrl: string | null
): Promise<Ok> {
  if (!name.trim()) return { ok: false, error: "El rival necesita un nombre." };
  const supabase = await createClient();
  const res = await new OrganizationService(supabase).updateOpponent(
    id,
    name,
    logoUrl
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/esports", "layout");
  return { ok: true };
}

/** Delete a rival. */
export async function deleteOpponent(id: string): Promise<Ok> {
  const supabase = await createClient();
  const res = await new OrganizationService(supabase).deleteOpponent(id);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

/** Add a map/mode option to the catalog. */
export async function addGameOption(
  kind: "map" | "mode",
  label: string
): Promise<Ok> {
  if (!label.trim()) return { ok: false, error: "Escribe un nombre." };
  const org = await resolveOrgId();
  if (!org.ok) return { ok: false, error: org.error };

  const supabase = await createClient();
  const res = await new OrganizationService(supabase).addGameOption(
    org.orgId,
    kind,
    label
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/esports", "layout");
  return { ok: true };
}

/** Delete a map/mode option. */
export async function deleteGameOption(id: string): Promise<Ok> {
  const supabase = await createClient();
  const res = await new OrganizationService(supabase).deleteGameOption(id);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/esports", "layout");
  return { ok: true };
}

/** Toggle the org default "announce on Discord". */
export async function setDiscordNotify(enabled: boolean): Promise<Ok> {
  const org = await resolveOrgId();
  if (!org.ok) return { ok: false, error: org.error };

  const supabase = await createClient();
  const res = await new OrganizationService(supabase).setDiscordNotify(
    org.orgId,
    enabled
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Load a suggested set of maps/modes into the catalog. */
export async function seedDefaultGameOptions(): Promise<Ok> {
  const org = await resolveOrgId();
  if (!org.ok) return { ok: false, error: org.error };

  const supabase = await createClient();
  const res = await new OrganizationService(supabase).seedDefaultGameOptions(
    org.orgId
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/dashboard/esports", "layout");
  return { ok: true };
}

/** Create a demo team with 5 fully-profiled players. */
export async function seedDemoTeam(): Promise<OkId> {
  const org = await resolveOrgId();
  if (!org.ok) return { ok: false, error: org.error };

  const supabase = await createClient();
  const res = await new OrganizationService(supabase).seedDemoTeam(org.orgId);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/dashboard/esports", "layout");
  revalidatePath("/dashboard/members", "layout");
  return { ok: true, id: res.data };
}
