import { redirect } from "next/navigation";
import { Swords, Clapperboard, Trophy, HeartPulse } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { ContentService } from "@/features/content/content-service";
import { LeagueService } from "@/features/league/league-service";
import { CreateOrgForm } from "@/features/organizations/components/create-org-form";
import { RosterPanel } from "@/features/members/components/roster-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryCard } from "@/components/layout/summary-card";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
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
          No se pudo cargar tu organización: {ctx.error}
        </CardContent>
      </Card>
    );
  }

  if (!ctx.data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Crea tu organización</CardTitle>
          <p className="text-sm text-tc-fg-tertiary">
            Configura tu centro de comando para empezar.
          </p>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    );
  }

  const { organization, role } = ctx.data;
  const orgId = organization.id;

  // Pull a snapshot across all modules in parallel.
  const [membersRes, teamsRes, contentRes, leaguesRes, wellbeingRes] =
    await Promise.all([
      new MemberService(supabase).listMembers(orgId),
      new EsportsService(supabase).listTeams(orgId),
      new ContentService(supabase).listContent(orgId),
      new LeagueService(supabase).listLeagues(orgId),
      new EsportsService(supabase).getPlayerWellbeing(orgId),
    ]);

  const members = membersRes.ok ? membersRes.data : [];
  const teams = teamsRes.ok ? teamsRes.data : [];
  const content = contentRes.ok ? contentRes.data : [];
  const leagues = leaguesRes.ok ? leaguesRes.data : [];
  const wellbeing = wellbeingRes.ok ? wellbeingRes.data : [];

  const contentInProgress = content.filter(
    (c) => c.status === "editing" || c.status === "review"
  ).length;
  const atRisk = wellbeing.filter((p) => p.signal === "elevated").length;

  return (
    <div>
      <PageHeader
        eyebrow={`Organización · eres ${role}`}
        title={organization.name}
        subtitle="Tu centro de comando. Entra a cualquier área, o gestiona tu roster abajo."
        actions={
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
            <StatTile label="Miembros" value={members.length} tone="accent" />
            <StatTile
              label="Jugadores"
              value={members.filter((m) => m.isPlayer).length}
            />
            <StatTile
              label="Creadores"
              value={members.filter((m) => m.isCreator).length}
            />
          </div>
        }
      />

      {/* Cross-module snapshot */}
      <div className="tc-stagger mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          href="/dashboard/esports"
          label="Equipos"
          value={teams.length}
          hint="squads de esports"
          icon={Swords}
        />
        <SummaryCard
          href="/dashboard/content"
          label="En progreso"
          value={contentInProgress}
          hint={`${content.length} piezas en total`}
          icon={Clapperboard}
        />
        <SummaryCard
          href="/dashboard/league"
          label="Ligas"
          value={leagues.length}
          hint="Temp League"
          icon={Trophy}
        />
        <SummaryCard
          href="/dashboard/esports"
          label="Requieren atención"
          value={atRisk}
          hint="jugadores en riesgo"
          icon={HeartPulse}
          tone={atRisk > 0 ? "accent" : "neutral"}
        />
      </div>

      <RosterPanel members={members} />
    </div>
  );
}
