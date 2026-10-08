import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { CreateTeamForm } from "@/features/esports/components/create-team-form";
import { CheckinForm } from "@/features/esports/components/checkin-form";
import { WellbeingPanel } from "@/features/esports/components/wellbeing-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import type { RosterPlayer } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function EsportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orgService = new OrganizationService(supabase);
  const ctx = await orgService.getCurrentOrgContext(user.id);

  if (!ctx.ok) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-[hsl(var(--tc-destructive))]">
          Error loading organization: {ctx.error}
        </CardContent>
      </Card>
    );
  }

  if (!ctx.data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-tc-fg-tertiary">
          Create your organization first (Overview tab).
        </CardContent>
      </Card>
    );
  }

  const orgId = ctx.data.organization.id;
  const esports = new EsportsService(supabase);
  const members = new MemberService(supabase);

  const [teamsRes, wellbeingRes, membersRes] = await Promise.all([
    esports.listTeams(orgId),
    esports.getPlayerWellbeing(orgId),
    members.listMembers(orgId),
  ]);

  const teams = teamsRes.ok ? teamsRes.data : [];
  const wellbeing = wellbeingRes.ok ? wellbeingRes.data : [];

  // Players available for check-ins = members flagged as player.
  const playerOptions: RosterPlayer[] = (membersRes.ok ? membersRes.data : [])
    .filter((m) => m.isPlayer)
    .map((m) => ({
      slotId: m.membershipId,
      membershipId: m.membershipId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      position: null,
    }));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-tc-border-soft pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-tc-fg-muted">
            Esports
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-tc-fg">
            Teams &amp; player sustainability
          </h1>
        </div>
        <div className="flex gap-6">
          <Stat label="Teams" value={teams.length} />
          <Stat label="Players" value={playerOptions.length} />
          <Stat
            label="Need check-in"
            value={wellbeing.filter((p) => p.signal === "elevated").length}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          {/* Teams */}
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
              Teams
            </h2>
            {teams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-tc-fg-tertiary">
                  No teams yet. Create one on the right.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-tc-border bg-card p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-tc-fg">{t.name}</span>
                      <Badge>{t.format}</Badge>
                    </div>
                    <Stat label="Roster" value={t.rosterCount} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Player sustainability */}
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
              Player sustainability
            </h2>
            <WellbeingPanel players={wellbeing} />
          </section>
        </div>

        {/* Side forms */}
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create team</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTeamForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wellbeing check-in</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Log how a player is doing today.
              </p>
            </CardHeader>
            <CardContent>
              <CheckinForm players={playerOptions} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
