"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { LeagueService } from "./league-service";

export type ActionResult = { error?: string };

const VALID_FORMATS = ["versus-4v4", "horde-siege"];

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

export async function createLeague(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "versus-4v4");
  if (!name) return { error: "League name is required." };
  if (!VALID_FORMATS.includes(format)) return { error: "Pick a valid format." };

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).createLeague(org.orgId, {
    name,
    format,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export async function addLeagueTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const leagueId = String(formData.get("leagueId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;

  if (!leagueId) return { error: "Pick a league." };
  if (!name) return { error: "Team name is required." };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).addTeam(leagueId, {
    name,
    contact,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export async function createMatch(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const leagueId = String(formData.get("leagueId") ?? "");
  const homeTeamId = String(formData.get("homeTeamId") ?? "");
  const awayTeamId = String(formData.get("awayTeamId") ?? "");

  if (!leagueId || !homeTeamId || !awayTeamId) {
    return { error: "League and both teams are required." };
  }
  if (homeTeamId === awayTeamId) {
    return { error: "A team cannot play itself." };
  }

  const supabase = await createClient();
  const result = await new LeagueService(supabase).createMatch(
    leagueId,
    homeTeamId,
    awayTeamId
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export type RecapResult =
  | { ok: true; recap: string | null }
  | { ok: false; error: string };

/** Build a ready-to-post recap for a reported match. */
export async function getMatchRecap(
  leagueId: string,
  matchId: string
): Promise<RecapResult> {
  if (!leagueId || !matchId) return { ok: false, error: "Missing match." };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).buildMatchRecap(
    leagueId,
    matchId
  );
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, recap: result.data };
}

export async function reportResult(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const matchId = String(formData.get("matchId") ?? "");
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  if (!matchId) return { error: "Missing match." };
  if (!Number.isInteger(homeScore) || homeScore < 0) {
    return { error: "Home score must be a non-negative number." };
  }
  if (!Number.isInteger(awayScore) || awayScore < 0) {
    return { error: "Away score must be a non-negative number." };
  }

  const supabase = await createClient();
  const result = await new LeagueService(supabase).reportResult(
    matchId,
    homeScore,
    awayScore
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export async function deleteLeague(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const leagueId = String(formData.get("leagueId") ?? "");
  if (!leagueId) return { error: "Missing league." };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).deleteLeague(leagueId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export async function removeLeagueTeam(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) return { error: "Missing team." };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).removeTeam(teamId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}

export async function updateLeague(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const leagueId = String(formData.get("leagueId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "versus-4v4");

  if (!leagueId) return { error: "Missing league." };
  if (!name) return { error: "League name is required." };
  if (!VALID_FORMATS.includes(format)) return { error: "Pick a valid format." };

  const supabase = await createClient();
  const result = await new LeagueService(supabase).updateLeague(leagueId, {
    name,
    format,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/league");
  return {};
}
