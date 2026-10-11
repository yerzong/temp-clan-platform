"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { EsportsService } from "./esports-service";

export type ActionResult = { error?: string };

/** Resolve the current user's org id, or an error. */
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

const VALID_GAMES = ["gears-e-day", "valorant", "lol", "cs2", "fortnite", "other"];

/** Create a team with game, optional platform, and N empty named slots. */
export async function createTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const game = String(formData.get("game") ?? "gears-e-day");
  const platform = String(formData.get("platform") ?? "").trim() || null;
  const slotCount = Number(formData.get("slotCount"));

  if (!name) return { error: "El nombre del equipo es obligatorio." };
  if (!VALID_GAMES.includes(game)) return { error: "Elige un juego válido." };
  if (!Number.isInteger(slotCount) || slotCount < 1 || slotCount > 20) {
    return { error: "El número de slots debe estar entre 1 y 20." };
  }

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).createTeamWithSlots(
    org.orgId,
    { name, game, platform, slotCount }
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Assign a player to a specific slot. */
export async function assignSlot(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!slotId || !membershipId) return { error: "Falta el slot o el jugador." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).assignSlot(
    slotId,
    membershipId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Empty a slot (keeps its label). */
export async function clearSlot(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Falta el slot." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).clearSlot(slotId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Rename a slot. */
export async function renameSlot(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!slotId) return { error: "Falta el slot." };
  if (!label) return { error: "El nombre del slot es obligatorio." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).renameSlot(slotId, label);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Set the team captain. */
export async function setCaptain(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Falta el slot." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).setCaptain(slotId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

export async function addToRoster(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const position = String(formData.get("position") ?? "").trim() || null;

  if (!teamId || !membershipId) {
    return { error: "Team and player are required." };
  }

  const supabase = await createClient();
  const result = await new EsportsService(supabase).addToRoster(
    teamId,
    membershipId,
    position
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

export async function deleteTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) return { error: "Missing team." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).deleteTeam(teamId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports");
  return {};
}

export async function removeFromRoster(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Missing roster slot." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).removeFromRoster(slotId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

export async function updateTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const game = String(formData.get("game") ?? "gears-e-day");
  const platform = String(formData.get("platform") ?? "").trim() || null;

  if (!teamId) return { error: "Falta el equipo." };
  if (!name) return { error: "El nombre del equipo es obligatorio." };
  if (!VALID_GAMES.includes(game)) return { error: "Elige un juego válido." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).updateTeamMeta(teamId, {
    name,
    game,
    platform,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Add one empty slot to a team. */
export async function addSlot(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!teamId) return { error: "Falta el equipo." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).addSlot(teamId, label);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Delete a slot entirely. */
export async function deleteSlot(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Falta el slot." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).deleteSlot(slotId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}

/** Create a single-use invite link that fills a specific slot. Returns token. */
export async function createSlotInvite(
  slotId: string
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!slotId) return { ok: false, error: "Falta el slot." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  const result = await new EsportsService(supabase).createSlotInvite(slotId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return { ok: true, token: result.data };
}

/** Set a team's slot count (grow/shrink). */
export async function setSlotCount(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const count = Number(formData.get("count"));
  if (!teamId) return { error: "Falta el equipo." };
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return { error: "El número de slots debe estar entre 1 y 20." };
  }

  const supabase = await createClient();
  const result = await new EsportsService(supabase).setSlotCount(teamId, count);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports", "layout");
  return {};
}
