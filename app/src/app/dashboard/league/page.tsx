import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { LeagueService } from "@/features/league/league-service";
import { CreateLeagueForm } from "@/features/league/components/create-league-form";
import { AddTeamForm } from "@/features/league/components/add-team-form";
import { CreateMatchForm } from "@/features/league/components/create-match-form";
import { MatchList } from "@/features/league/components/match-list";
import { StandingsTable } from "@/features/league/components/standings-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league: selectedId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  if (!ctx.ok || !ctx.data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-tc-fg-tertiary">
          Create your organization first (Overview tab).
        </CardContent>
      </Card>
    );
  }

  const orgId = ctx.data.organization.id;
  const service = new LeagueService(supabase);
  const leaguesRes = await service.listLeagues(orgId);
  const leagues = leaguesRes.ok ? leaguesRes.data : [];

  const current =
    leagues.find((l) => l.id === selectedId) ?? leagues[0] ?? null;

  // Load the current league's teams, matches, standings.
  const [teamsRes, matchesRes, standingsRes] = current
    ? await Promise.all([
        service.listTeams(current.id),
        service.listMatches(current.id),
        service.getStandings(current.id),
      ])
    : [null, null, null];

  const teams = teamsRes?.ok ? teamsRes.data : [];
  const matches = matchesRes?.ok ? matchesRes.data : [];
  const standings = standingsRes?.ok ? standingsRes.data : [];

  return (
    <div>
      <PageHeader
        eyebrow="Temp League"
        title={current ? current.name : "League manager"}
        actions={
          current ? (
            <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
              <StatTile label="Teams" value={teams.length} tone="accent" />
              <StatTile label="Matches" value={matches.length} />
              <StatTile
                label="Reported"
                value={matches.filter((m) => m.status === "reported").length}
              />
            </div>
          ) : undefined
        }
      />

      {/* League selector tabs */}
      {leagues.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {leagues.map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/league?league=${l.id}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                current?.id === l.id
                  ? "border-tc-accent bg-tc-surface-2 text-tc-fg"
                  : "border-tc-border text-tc-fg-tertiary hover:border-tc-border-strong hover:text-tc-fg-secondary"
              )}
            >
              {l.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          {!current ? (
            <EmptyState
              icon={<Trophy className="h-4 w-4" />}
              title="No league yet"
              description="Create your first league on the right to enroll teams and run fixtures."
            />
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
                  Standings
                </h2>
                <StandingsTable rows={standings} />
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
                  Matches
                </h2>
                <MatchList matches={matches} />
              </section>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New league</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateLeagueForm />
            </CardContent>
          </Card>

          {current && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Enroll team</CardTitle>
                  <p className="text-sm text-tc-fg-tertiary">
                    Add an external team to {current.name}.
                  </p>
                </CardHeader>
                <CardContent>
                  <AddTeamForm leagueId={current.id} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schedule match</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreateMatchForm leagueId={current.id} teams={teams} />
                </CardContent>
              </Card>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
