"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { EsportsService } from "./esports-service";

export type ActionResult = { error?: string };

const VALID_FORMATS = ["versus-4v4", "horde-siege"];

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

export async function createTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "versus-4v4");

  if (!name) return { error: "Team name is required." };
  if (!VALID_FORMATS.includes(format)) return { error: "Pick a valid format." };

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).createTeam(org.orgId, {
    name,
    format,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports");
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

  revalidatePath("/dashboard/esports");
  return {};
}

export async function addCheckin(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const membershipId = String(formData.get("membershipId") ?? "");
  const mood = Number(formData.get("mood"));
  const rest = Number(formData.get("rest"));
  const practiceHours = Number(formData.get("practiceHours"));
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!membershipId) return { error: "Player is required." };
  if (!(mood >= 1 && mood <= 5)) return { error: "Mood must be 1-5." };
  if (!(rest >= 1 && rest <= 5)) return { error: "Rest must be 1-5." };
  if (!(practiceHours >= 0 && practiceHours <= 24)) {
    return { error: "Practice hours must be 0-24." };
  }

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).addCheckin(
    org.orgId,
    membershipId,
    { mood, rest, practiceHours, note }
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports");
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

  revalidatePath("/dashboard/esports");
  return {};
}

export async function updateTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "versus-4v4");

  if (!teamId) return { error: "Missing team." };
  if (!name) return { error: "Team name is required." };
  if (!VALID_FORMATS.includes(format)) return { error: "Pick a valid format." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).updateTeam(teamId, {
    name,
    format,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/esports");
  return {};
}
