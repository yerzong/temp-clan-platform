"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { EsportsService } from "./esports-service";
import type { AttendanceStatus, TeamEventKind } from "@/lib/domain/types";

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

// --- Team events (scrims / matches / practices) -----------------------------

const VALID_KINDS: TeamEventKind[] = ["scrim", "official", "practice"];
const VALID_STATUSES: AttendanceStatus[] = ["yes", "no", "maybe", "pending"];

const KIND_LABELS: Record<TeamEventKind, string> = {
  scrim: "Scrim",
  official: "Partido oficial",
  practice: "Práctica",
};

/** Parse a datetime-local string into an ISO timestamp, or null if invalid. */
function parseScheduledAt(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Post a convocatoria to the team's Discord channel (best-effort). */
async function postToDiscord(
  webhookUrl: string,
  args: {
    teamName: string;
    kind: TeamEventKind;
    title: string;
    opponent: string | null;
    scheduledAt: string;
    gameMode: string | null;
    maps: string[];
  }
): Promise<void> {
  const when = new Date(args.scheduledAt).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const lines = [
    `🎮 **${KIND_LABELS[args.kind]} · ${args.teamName}**`,
    `**${args.title}**`,
    args.opponent ? `🆚 ${args.opponent}` : null,
    `🗓️ ${when}`,
    args.gameMode ? `🎯 Modo: ${args.gameMode}` : null,
    args.maps.length ? `🗺️ Mapas: ${args.maps.join(", ")}` : null,
    `Confirma tu asistencia en Temp Platform.`,
  ].filter(Boolean);
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: lines.join("\n") }),
    });
  } catch {
    // Webhook failures never block scheduling.
  }
}

interface EventFields {
  kind: TeamEventKind;
  title: string;
  opponent: string | null;
  opponentId: string | null;
  opponentLabel: string | null;
  scheduledAt: string;
  durationMin: number | null;
  gameMode: string | null;
  maps: string[];
  notes: string | null;
}

/** Read + validate the shared event fields from a form. */
function readEventForm(
  formData: FormData
): { ok: true; fields: EventFields } | { ok: false; error: string } {
  const kind = String(formData.get("kind") ?? "scrim") as TeamEventKind;
  const title = String(formData.get("title") ?? "").trim();
  const opponentId = String(formData.get("opponentId") ?? "").trim() || null;
  const opponent = opponentId
    ? null
    : String(formData.get("opponent") ?? "").trim() || null;
  const opponentLabel =
    String(formData.get("opponentLabel") ?? "").trim() || opponent;
  const scheduledAt = parseScheduledAt(String(formData.get("scheduledAt") ?? ""));
  const durationRaw = String(formData.get("durationMin") ?? "").trim();
  const durationMin = durationRaw ? Number(durationRaw) : null;
  const gameMode = String(formData.get("gameMode") ?? "").trim() || null;
  const maps = formData
    .getAll("maps")
    .map((m) => String(m).trim())
    .filter(Boolean);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!VALID_KINDS.includes(kind)) return { ok: false, error: "Tipo inválido." };
  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (!scheduledAt) return { ok: false, error: "La fecha y hora son obligatorias." };
  if (durationMin !== null && (!Number.isInteger(durationMin) || durationMin <= 0)) {
    return { ok: false, error: "La duración debe ser un número de minutos válido." };
  }
  return {
    ok: true,
    fields: {
      kind,
      title,
      opponent,
      opponentId,
      opponentLabel,
      scheduledAt,
      durationMin,
      gameMode,
      maps,
      notes,
    },
  };
}

/** Schedule a team event and (optionally) announce it on Discord. */
export async function createEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const teamName = String(formData.get("teamName") ?? "").trim();
  const notify = formData.get("notifyDiscord") != null;
  if (!teamId) return { error: "Falta el equipo." };

  const parsed = readEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const f = parsed.fields;

  const supabase = await createClient();
  const esports = new EsportsService(supabase);
  const result = await esports.createTeamEvent(teamId, f);
  if (!result.ok) return { error: result.error };

  // Announce on Discord: the team's own channel overrides the org default.
  if (notify) {
    const teamHook = await esports.getTeamDiscordWebhook(teamId);
    let webhook = teamHook.ok ? teamHook.data : null;
    if (!webhook) {
      const org = await resolveOrgId();
      if (org.ok) {
        const orgHook = await new OrganizationService(
          supabase
        ).getDiscordWebhook(org.orgId);
        webhook = orgHook.ok ? orgHook.data : null;
      }
    }
    if (webhook) {
      await postToDiscord(webhook, {
        teamName: teamName || "el equipo",
        kind: f.kind,
        title: f.title,
        opponent: f.opponentLabel,
        scheduledAt: f.scheduledAt,
        gameMode: f.gameMode,
        maps: f.maps,
      });
    }
  }

  revalidatePath(`/dashboard/esports/${teamId}`);
  return {};
}

/** Set or clear the organization's Discord webhook URL (owner/admin). */
export async function setOrgDiscordWebhook(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const url = String(formData.get("webhookUrl") ?? "").trim() || null;
  if (url && !/^https:\/\/(.*\.)?discord\.com\/api\/webhooks\//.test(url)) {
    return { error: "Pega una URL de webhook de Discord válida." };
  }

  const org = await resolveOrgId();
  if (!org.ok) return { error: org.error };

  const supabase = await createClient();
  const result = await new OrganizationService(supabase).setDiscordWebhook(
    org.orgId,
    url
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard", "layout");
  return {};
}

/** Edit an existing event. */
export async function updateEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const eventId = String(formData.get("eventId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!eventId) return { error: "Falta el evento." };

  const parsed = readEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).updateTeamEvent(
    eventId,
    parsed.fields
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/esports/${teamId}`);
  return {};
}

/** Delete an event. */
export async function deleteEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const eventId = String(formData.get("eventId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!eventId) return { error: "Falta el evento." };

  const supabase = await createClient();
  const result = await new EsportsService(supabase).deleteTeamEvent(eventId);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/esports/${teamId}`);
  return {};
}

/** Set a player's attendance for an event. */
export async function setAttendance(input: {
  eventId: string;
  membershipId: string;
  status: AttendanceStatus;
  teamId: string;
}): Promise<ActionResult> {
  if (!input.eventId || !input.membershipId) {
    return { error: "Faltan datos de la asistencia." };
  }
  if (!VALID_STATUSES.includes(input.status)) {
    return { error: "Estado de asistencia inválido." };
  }

  const supabase = await createClient();
  const result = await new EsportsService(supabase).setEventAttendance(
    input.eventId,
    input.membershipId,
    input.status
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/esports/${input.teamId}`);
  return {};
}

/** Set or clear a team's Discord webhook URL. */
export async function setDiscordWebhook(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const teamId = String(formData.get("teamId") ?? "");
  const url = String(formData.get("webhookUrl") ?? "").trim() || null;
  if (!teamId) return { error: "Falta el equipo." };
  if (url && !/^https:\/\/(.*\.)?discord\.com\/api\/webhooks\//.test(url)) {
    return { error: "Pega una URL de webhook de Discord válida." };
  }

  const supabase = await createClient();
  const result = await new EsportsService(supabase).setTeamDiscordWebhook(
    teamId,
    url
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/esports/${teamId}`);
  return {};
}

/** Fill a team's empty slots with fully-profiled demo players. */
export async function fillTeamDemo(
  teamId: string
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  if (!teamId) return { ok: false, error: "Falta el equipo." };
  const supabase = await createClient();
  const result = await new EsportsService(supabase).fillTeamDemo(teamId);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/dashboard/esports/${teamId}`);
  revalidatePath("/dashboard/members", "layout");
  return { ok: true, created: result.data };
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
