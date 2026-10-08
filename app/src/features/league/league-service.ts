import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  League,
  LeagueTeam,
  Match,
  StandingRow,
  LeagueStatus,
  MatchStatus,
  Result,
} from "@/lib/domain/types";

/**
 * League service — owns Temp League data: leagues, external teams, matches,
 * and the DERIVED standings table. Single responsibility: the league. Standings
 * are computed here (business logic lives in the service, not the UI).
 */
export class LeagueService {
  constructor(private readonly supabase: SupabaseClient) {}

  async listLeagues(orgId: string): Promise<Result<League[]>> {
    const { data, error } = await this.supabase
      .from("leagues")
      .select("id, name, game, format, status, league_teams ( id )")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };

    const leagues: League[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      game: row.game as string,
      format: row.format as string,
      status: row.status as LeagueStatus,
      teamCount: Array.isArray(row.league_teams) ? row.league_teams.length : 0,
    }));

    return { ok: true, data: leagues };
  }

  async createLeague(
    orgId: string,
    input: { name: string; format: string }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("leagues")
      .insert({ org_id: orgId, name: input.name, format: input.format })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  async listTeams(leagueId: string): Promise<Result<LeagueTeam[]>> {
    const { data, error } = await this.supabase
      .from("league_teams")
      .select("id, name, contact")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };

    const teams: LeagueTeam[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      contact: (row.contact as string | null) ?? null,
    }));

    return { ok: true, data: teams };
  }

  async addTeam(
    leagueId: string,
    input: { name: string; contact: string | null }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("league_teams")
      .insert({ league_id: leagueId, name: input.name, contact: input.contact })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  /** Delete a league (cascades its teams and matches). */
  async deleteLeague(leagueId: string): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Remove a team from a league (cascades its matches). */
  async removeTeam(teamId: string): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("league_teams")
      .delete()
      .eq("id", teamId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  async listMatches(leagueId: string): Promise<Result<Match[]>> {
    const { data, error } = await this.supabase
      .from("matches")
      .select(
        "id, home_team_id, away_team_id, status, home_score, away_score, home:home_team_id ( name ), away:away_team_id ( name )"
      )
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const matches: Match[] = (data ?? []).map((row) => {
      const home = row.home as unknown as { name?: string } | null;
      const away = row.away as unknown as { name?: string } | null;
      return {
        id: row.id as string,
        homeTeamId: row.home_team_id as string,
        awayTeamId: row.away_team_id as string,
        homeTeamName: home?.name ?? "?",
        awayTeamName: away?.name ?? "?",
        status: row.status as MatchStatus,
        homeScore: row.home_score as number | null,
        awayScore: row.away_score as number | null,
      };
    });

    return { ok: true, data: matches };
  }

  async createMatch(
    leagueId: string,
    homeTeamId: string,
    awayTeamId: string
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("matches")
      .insert({
        league_id: leagueId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  async reportResult(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "reported",
      })
      .eq("id", matchId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /**
   * Derive the standings table from reported matches. Business logic lives here.
   * 3 points per win, 0 per loss (draws not expected in Gears but handled as 0).
   */
  async getStandings(leagueId: string): Promise<Result<StandingRow[]>> {
    const teamsRes = await this.listTeams(leagueId);
    if (!teamsRes.ok) return teamsRes;

    const matchesRes = await this.listMatches(leagueId);
    if (!matchesRes.ok) return matchesRes;

    const rows = new Map<string, StandingRow>();
    for (const t of teamsRes.data) {
      rows.set(t.id, {
        teamId: t.id,
        teamName: t.name,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
      });
    }

    for (const m of matchesRes.data) {
      if (m.status !== "reported" || m.homeScore === null || m.awayScore === null)
        continue;
      const home = rows.get(m.homeTeamId);
      const away = rows.get(m.awayTeamId);
      if (!home || !away) continue;

      home.played++;
      away.played++;
      if (m.homeScore > m.awayScore) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (m.awayScore > m.homeScore) {
        away.won++;
        away.points += 3;
        home.lost++;
      }
    }

    const standings = [...rows.values()].sort(
      (a, b) => b.points - a.points || b.won - a.won
    );

    return { ok: true, data: standings };
  }
}
