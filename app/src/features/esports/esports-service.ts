import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Team,
  RosterPlayer,
  PlayerWellbeing,
  WellbeingCheckin,
  BurnoutSignal,
  Result,
} from "@/lib/domain/types";

/**
 * Esports service — owns teams, rosters, and the wellbeing/sustainability data.
 * Single responsibility: the competitive side of an organization. The UI never
 * queries Supabase directly; it goes through here. Errors returned as Result.
 */
export class EsportsService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** All teams in an org, with roster counts. */
  async listTeams(orgId: string): Promise<Result<Team[]>> {
    const { data, error } = await this.supabase
      .from("teams")
      .select("id, name, game, format, roster_slots ( id )")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };

    const teams: Team[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      game: row.game as string,
      format: row.format as string,
      rosterCount: Array.isArray(row.roster_slots)
        ? row.roster_slots.length
        : 0,
    }));

    return { ok: true, data: teams };
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
