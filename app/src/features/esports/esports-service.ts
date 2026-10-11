import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Team,
  TeamSlot,
  RosterPlayer,
  PlayerWellbeing,
  WellbeingCheckin,
  BurnoutSignal,
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
  };
}

/**
 * Esports service — owns teams, rosters, and the wellbeing/sustainability data.
 * Single responsibility: the competitive side of an organization. The UI never
 * queries Supabase directly; it goes through here. Errors returned as Result.
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
      .select(TEAM_SELECT)
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

  /** Record a wellbeing check-in for a player. */
  async addCheckin(
    orgId: string,
    membershipId: string,
    input: { mood: number; rest: number; practiceHours: number; note?: string }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("wellbeing_checkins")
      .insert({
        org_id: orgId,
        membership_id: membershipId,
        mood: input.mood,
        rest: input.rest,
        practice_hours: input.practiceHours,
        note: input.note ?? null,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  /**
   * Wellbeing snapshot per player: their latest check-in + a burnout SIGNAL.
   * The signal is a heuristic prompt to check in with the person — NOT a
   * medical diagnosis. Based on recent self-reported mood/rest/practice load.
   */
  async getPlayerWellbeing(orgId: string): Promise<Result<PlayerWellbeing[]>> {
    // Players = members flagged is_player in this org.
    const { data: players, error: playersError } = await this.supabase
      .from("memberships")
      .select("id, member_profiles!inner ( display_name, avatar_url, is_player )")
      .eq("org_id", orgId)
      .eq("member_profiles.is_player", true);

    if (playersError) return { ok: false, error: playersError.message };

    // Recent check-ins (last 14 days) for the org.
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const { data: checkins, error: checkinsError } = await this.supabase
      .from("wellbeing_checkins")
      .select("id, membership_id, checkin_date, mood, rest, practice_hours, note")
      .eq("org_id", orgId)
      .gte("checkin_date", since.toISOString().slice(0, 10))
      .order("checkin_date", { ascending: false });

    if (checkinsError) return { ok: false, error: checkinsError.message };

    const byMember = new Map<string, WellbeingCheckin[]>();
    for (const c of checkins ?? []) {
      const mapped: WellbeingCheckin = {
        id: c.id as string,
        membershipId: c.membership_id as string,
        checkinDate: c.checkin_date as string,
        mood: c.mood as number,
        rest: c.rest as number,
        practiceHours: Number(c.practice_hours),
        note: (c.note as string | null) ?? null,
      };
      const list = byMember.get(mapped.membershipId) ?? [];
      list.push(mapped);
      byMember.set(mapped.membershipId, list);
    }

    const result: PlayerWellbeing[] = (players ?? []).map((p) => {
      const profile = p.member_profiles as unknown as {
        display_name?: string;
        avatar_url?: string | null;
      };
      const recent = byMember.get(p.id as string) ?? [];
      const latest = recent[0] ?? null;
      return {
        membershipId: p.id as string,
        displayName: profile?.display_name ?? "Unnamed",
        avatarUrl: profile?.avatar_url ?? null,
        latest,
        signal: computeBurnoutSignal(recent),
      };
    });

    return { ok: true, data: result };
  }
}

/**
 * Burnout heuristic from recent check-ins. A PROMPT, not a diagnosis.
 * - unknown: no recent data
 * - elevated: low mood/rest or high sustained practice load
 * - watch: moderate signs
 * - ok: healthy range
 */
function computeBurnoutSignal(recent: WellbeingCheckin[]): BurnoutSignal {
  if (recent.length === 0) return "unknown";

  const sample = recent.slice(0, 5);
  const avg = (nums: number[]) =>
    nums.reduce((a, b) => a + b, 0) / nums.length;

  const avgMood = avg(sample.map((c) => c.mood));
  const avgRest = avg(sample.map((c) => c.rest));
  const avgHours = avg(sample.map((c) => c.practiceHours));

  // High sustained load OR consistently low mood/rest -> elevated.
  if (avgMood <= 2.2 || avgRest <= 2.2 || avgHours >= 8) return "elevated";
  if (avgMood <= 3 || avgRest <= 3 || avgHours >= 6) return "watch";
  return "ok";
}
