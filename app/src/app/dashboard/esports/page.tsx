import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { CreateTeamForm } from "@/features/esports/components/create-team-form";
import { AssignRosterForm } from "@/features/esports/components/assign-roster-form";
import { CheckinForm } from "@/features/esports/components/checkin-form";
import { WellbeingPanel } from "@/features/esports/components/wellbeing-panel";
import { TeamCard } from "@/features/esports/components/team-card";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader
        eyebrow="Esports"
        title="Equipos y sostenibilidad"
        subtitle="Crea squads, asigna jugadores al roster y registra check-ins de bienestar para detectar el burnout a tiempo."
        actions={
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
            <StatTile label="Equipos" value={teams.length} />
            <StatTile label="Jugadores" value={playerOptions.length} />
            <StatTile
              label="Atención"
              value={wellbeing.filter((p) => p.signal === "elevated").length}
              tone={
                wellbeing.some((p) => p.signal === "elevated")
                  ? "accent"
                  : "neutral"
              }
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          {/* Teams */}
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
              Equipos
            </h2>
            {teams.length === 0 ? (
              <EmptyState
                icon={<Swords className="h-4 w-4" />}
                title="Sin equipos aún"
                description="Crea tu primer squad a la derecha para empezar a armar el roster."
              />
            ) : (
              <div className="grid gap-2.5">
                {teams.map((t) => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </div>
            )}
          </section>

          {/* Player sustainability */}
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
              Sostenibilidad del jugador
            </h2>
            <WellbeingPanel players={wellbeing} />
          </section>
        </div>

        {/* Side forms */}
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crear equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTeamForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asignar al roster</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Pon un jugador en un equipo.
              </p>
            </CardHeader>
            <CardContent>
              <AssignRosterForm teams={teams} players={playerOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Check-in de bienestar</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Registra cómo está un jugador hoy.
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
