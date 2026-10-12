import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Team,
  TeamSlot,
  RosterPlayer,
  TeamEvent,
  TeamEventKind,
  EventAttendee,
  AttendanceStatus,
  Result,
} from "@/lib/domain/types";

const TEAM_SELECT =
  "id, name, game, format, platform, max_slots, roster_slots ( id, label, slot_order, is_captain, membership_id, memberships ( member_profiles ( display_name, avatar_url ) ) )";

/** Map a raw team row (with nested slots) to the Team domain shape. */
function mapTeam(row: Record<string, unknown>): Team {
  const rawSlots = Array.isArray(row.roster_slots) ? row.roster_slots : [];
  const slots: TeamSlot[] = rawSlots
    .map((s: Record<string, unknown>) => {
      const membership = s.memberships as unknown as {
        member_profiles?: { display_name?: string; avatar_url?: string | null };
      } | null;
      const profile = membership?.member_profiles;
      const membershipId = (s.membership_id as string | null) ?? null;
      return {
        slotId: s.id as string,
        label: (s.label as string | null) ?? "Slot",
        order: (s.slot_order as number | null) ?? 0,
        isCaptain: Boolean(s.is_captain),
        membershipId,
        displayName: membershipId ? profile?.display_name ?? "Sin nombre" : null,
        avatarUrl: membershipId ? profile?.avatar_url ?? null : null,
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    id: row.id as string,
    name: row.name as string,
    game: row.game as string,
    format: (row.format as string) ?? "",
    platform: (row.platform as string | null) ?? null,
    maxSlots: (row.max_slots as number | null) ?? slots.length,
    rosterCount: slots.filter((s) => s.membershipId).length,
    slots,
    // Only the boolean is kept; the webhook URL never reaches the client.
    hasDiscordWebhook:
      (row.discord_webhook_url as string | null | undefined) != null,
  };
}

/** Map a raw team_events row (with nested attendance) to the domain shape. */
function mapEvent(row: Record<string, unknown>): TeamEvent {
  const rawAttend = Array.isArray(row.event_attendance)
    ? row.event_attendance
    : [];
  const attendees: EventAttendee[] = rawAttend.map(
    (a: Record<string, unknown>) => {
      const membership = a.memberships as unknown as {
        member_profiles?: { display_name?: string; avatar_url?: string | null };
      } | null;
      const profile = membership?.member_profiles;
      return {
        membershipId: a.membership_id as string,
        displayName: profile?.display_name ?? "Sin nombre",
        avatarUrl: profile?.avatar_url ?? null,
        status: (a.status as AttendanceStatus) ?? "pending",
        reason: (a.reason as string | null) ?? null,
      };
    }
  );
  attendees.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const rival = row.opponents as unknown as {
    name?: string;
    logo_url?: string | null;
  } | null;

  return {
    id: row.id as string,
    teamId: row.team_id as string,
    kind: (row.kind as TeamEventKind) ?? "scrim",
    title: row.title as string,
    opponent: (row.opponent as string | null) ?? null,
    opponentId: (row.opponent_id as string | null) ?? null,
    opponentName: rival?.name ?? null,
    opponentLogoUrl: rival?.logo_url ?? null,
    scheduledAt: row.scheduled_at as string,
    durationMin: (row.duration_min as number | null) ?? null,
    gameMode: (row.game_mode as string | null) ?? null,
    maps: Array.isArray(row.maps) ? (row.maps as string[]) : [],
    teamSize: (row.team_size as string | null) ?? null,
    seriesFormat: (row.series_format as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    attendees,
  };
}

const EVENT_SELECT =
  "id, team_id, kind, title, opponent, opponent_id, scheduled_at, duration_min, game_mode, maps, team_size, series_format, notes, opponents ( name, logo_url ), event_attendance ( membership_id, status, reason, memberships ( member_profiles ( display_name, avatar_url ) ) )";

/**
 * Esports service — owns teams and rosters. Single responsibility: the
 * competitive side of an organization. The UI never queries Supabase directly;
 * it goes through here. Errors returned as Result.
 */
export class EsportsService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** All teams in an org, each with its slots (filled + empty). */
  async listTeams(orgId: string): Promise<Result<Team[]>> {
    const { data, error } = await this.supabase
      .from("teams")
      .select(TEAM_SELECT)
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []).map((r) => mapTeam(r)) };
  }

  /** A single team with its slots. */
  async getTeam(teamId: string): Promise<Result<Team | null>> {
    const { data, error } = await this.supabase
      .from("teams")
      .select(`${TEAM_SELECT}, discord_webhook_url`)
      .eq("id", teamId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };
    return { ok: true, data: mapTeam(data) };
  }

  /** Create a team with N empty named slots. */
  async createTeamWithSlots(
    orgId: string,
    input: {
      name: string;
      game: string;
      platform: string | null;
      slotCount: number;
    }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("create_team_with_slots", {
      target_org: orgId,
      p_name: input.name,
      p_game: input.game,
      p_platform: input.platform,
      p_slot_count: input.slotCount,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Assign a player to a specific slot. */
  async assignSlot(slotId: string, membershipId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("assign_slot", {
      p_slot_id: slotId,
      p_membership_id: membershipId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Empty a slot (keeps its label). */
  async clearSlot(slotId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("clear_slot", {
      p_slot_id: slotId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Rename a slot. */
  async renameSlot(slotId: string, label: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("rename_slot", {
      p_slot_id: slotId,
      p_label: label,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Set the team captain (a filled slot). */
  async setCaptain(slotId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_captain", {
      p_slot_id: slotId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Edit a team's name/game/platform. */
  async updateTeamMeta(
    teamId: string,
    input: { name: string; game: string; platform: string | null }
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("update_team_meta", {
      p_team_id: teamId,
      p_name: input.name,
      p_game: input.game,
      p_platform: input.platform,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Add one empty slot to a team. */
  async addSlot(teamId: string, label: string | null): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("add_team_slot", {
      p_team_id: teamId,
      p_label: label,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Delete a slot entirely. */
  async deleteSlot(slotId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_team_slot", {
      p_slot_id: slotId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Grow/shrink a team's slot count. */
  async setSlotCount(teamId: string, count: number): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_team_slot_count", {
      p_team_id: teamId,
      p_count: count,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /**
   * Twitch handles for a set of memberships: returns [membershipId, handle].
   * Used to resolve which players are live.
   */
  async getTwitchHandles(
    membershipIds: string[]
  ): Promise<Result<{ membershipId: string; handle: string }[]>> {
    if (membershipIds.length === 0) return { ok: true, data: [] };
    const { data, error } = await this.supabase
      .from("linked_accounts")
      .select("membership_id, handle")
      .eq("platform", "twitch")
      .in("membership_id", membershipIds);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data ?? []).map((r) => ({
        membershipId: r.membership_id as string,
        handle: r.handle as string,
      })),
    };
  }

  // --- Team events (scrims / matches / practices) ---------------------------

  /** All events for a team (ascending by date), each with its attendance. */
  async listTeamEvents(teamId: string): Promise<Result<TeamEvent[]>> {
    const { data, error } = await this.supabase
      .from("team_events")
      .select(EVENT_SELECT)
      .eq("team_id", teamId)
      .order("scheduled_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []).map((r) => mapEvent(r)) };
  }

  /** Schedule a team event; seeds attendance for the current roster. */
  async createTeamEvent(
    teamId: string,
    input: {
      kind: TeamEventKind;
      title: string;
      opponent: string | null;
      opponentId: string | null;
      scheduledAt: string;
      durationMin: number | null;
      gameMode: string | null;
      maps: string[];
      teamSize: string | null;
      seriesFormat: string | null;
      notes: string | null;
    }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("create_team_event", {
      p_team_id: teamId,
      p_kind: input.kind,
      p_title: input.title,
      p_opponent: input.opponent,
      p_opponent_id: input.opponentId,
      p_scheduled_at: input.scheduledAt,
      p_duration_min: input.durationMin,
      p_game_mode: input.gameMode,
      p_maps: input.maps,
      p_team_size: input.teamSize,
      p_series_format: input.seriesFormat,
      p_notes: input.notes,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Update an event's details. */
  async updateTeamEvent(
    eventId: string,
    input: {
      kind: TeamEventKind;
      title: string;
      opponent: string | null;
      opponentId: string | null;
      scheduledAt: string;
      durationMin: number | null;
      gameMode: string | null;
      maps: string[];
      teamSize: string | null;
      seriesFormat: string | null;
      notes: string | null;
    }
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("update_team_event", {
      p_event_id: eventId,
      p_kind: input.kind,
      p_title: input.title,
      p_opponent: input.opponent,
      p_opponent_id: input.opponentId,
      p_scheduled_at: input.scheduledAt,
      p_duration_min: input.durationMin,
      p_game_mode: input.gameMode,
      p_maps: input.maps,
      p_team_size: input.teamSize,
      p_series_format: input.seriesFormat,
      p_notes: input.notes,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Delete an event. */
  async deleteTeamEvent(eventId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_team_event", {
      p_event_id: eventId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Set a player's attendance (admin, or the player themselves). */
  async setEventAttendance(
    eventId: string,
    membershipId: string,
    status: AttendanceStatus,
    reason: string | null
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_event_attendance", {
      p_event_id: eventId,
      p_membership_id: membershipId,
      p_status: status,
      p_reason: reason,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Fill the team's empty slots with demo players. Returns # created. */
  async fillTeamDemo(teamId: string): Promise<Result<number>> {
    const { data, error } = await this.supabase.rpc("fill_team_demo", {
      p_team_id: teamId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data as number) ?? 0 };
  }

  /** Set or clear a team's Discord webhook URL (admin only). */
  async setTeamDiscordWebhook(
    teamId: string,
    url: string | null
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_team_discord_webhook", {
      p_team_id: teamId,
      p_url: url,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Read a team's Discord webhook URL (server-side use only, e.g. posting). */
  async getTeamDiscordWebhook(teamId: string): Promise<Result<string | null>> {
    const { data, error } = await this.supabase
      .from("teams")
      .select("discord_webhook_url")
      .eq("id", teamId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data?.discord_webhook_url as string | null) ?? null,
    };
  }

  /** Create a single-use 24h invite link that fills a specific slot. */
  async createSlotInvite(slotId: string): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("create_slot_invitation", {
      p_slot_id: slotId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Game catalog as a slug -> cover_url map (for list/detail covers). */
  async getGameCovers(): Promise<Result<Record<string, string | null>>> {
    const { data, error } = await this.supabase
      .from("games")
      .select("slug, cover_url");
    if (error) return { ok: false, error: error.message };
    const map: Record<string, string | null> = {};
    for (const row of data ?? []) {
      map[row.slug as string] = (row.cover_url as string | null) ?? null;
    }
    return { ok: true, data: map };
  }

  /** Create a team in the org. */
  async createTeam(
    orgId: string,
    input: { name: string; format: string }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("teams")
      .insert({ org_id: orgId, name: input.name, format: input.format })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  /** Rename / re-format a team. */
  async updateTeam(
    teamId: string,
    input: { name: string; format: string }
  ): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("teams")
      .update({ name: input.name, format: input.format })
      .eq("id", teamId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Delete a team (cascades its roster slots). */
  async deleteTeam(teamId: string): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("teams")
      .delete()
      .eq("id", teamId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Remove a player from a team roster. */
  async removeFromRoster(slotId: string): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("roster_slots")
      .delete()
      .eq("id", slotId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Players assigned to a team. */
  async listRoster(teamId: string): Promise<Result<RosterPlayer[]>> {
    const { data, error } = await this.supabase
      .from("roster_slots")
      .select(
        "id, position, membership_id, memberships ( member_profiles ( display_name, avatar_url ) )"
      )
      .eq("team_id", teamId);

    if (error) return { ok: false, error: error.message };

    const players: RosterPlayer[] = (data ?? []).map((row) => {
      const membership = row.memberships as unknown as {
        member_profiles?: { display_name?: string; avatar_url?: string | null };
      } | null;
      const profile = membership?.member_profiles;
      return {
        slotId: row.id as string,
        membershipId: row.membership_id as string,
        displayName: profile?.display_name ?? "Unnamed",
        avatarUrl: profile?.avatar_url ?? null,
        position: (row.position as string | null) ?? null,
      };
    });

    return { ok: true, data: players };
  }

  /** Assign a player (membership) to a team. */
  async addToRoster(
    teamId: string,
    membershipId: string,
    position: string | null
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("roster_slots")
      .insert({ team_id: teamId, membership_id: membershipId, position })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "That player is already on this team." };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true, data: data.id as string };
  }

}
