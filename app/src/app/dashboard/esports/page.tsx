import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { TeamList } from "@/features/esports/components/team-list";
import { CreateTeamPanel } from "@/features/esports/components/create-team-panel";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function EsportsPage() {
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
          Primero crea tu organización (pestaña Resumen).
        </CardContent>
      </Card>
    );
  }

  const orgId = ctx.data.organization.id;
  const esports = new EsportsService(supabase);
  const members = new MemberService(supabase);

  const [teamsRes, membersRes, coversRes] = await Promise.all([
    esports.listTeams(orgId),
    members.listMembers(orgId),
    esports.getGameCovers(),
  ]);

  const teams = teamsRes.ok ? teamsRes.data : [];
  const covers = coversRes.ok ? coversRes.data : {};
  const playerCount = (membersRes.ok ? membersRes.data : []).filter(
    (m) => m.isPlayer
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Esports"
        title="Equipos"
        subtitle="Crea squads y entra a cada equipo para armar su roster."
        actions={
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[260px]">
            <StatTile label="Equipos" value={teams.length} />
            <StatTile label="Jugadores" value={playerCount} />
          </div>
        }
      />

      {/* Teams list + create */}
      <section className="mb-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Equipos
          </h2>
          <CreateTeamPanel />
        </div>
        {teamsRes.ok === false ? (
          <Card>
            <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
              No se pudieron cargar los equipos: {teamsRes.error}
            </CardContent>
          </Card>
        ) : (
          <TeamList teams={teams} covers={covers} />
        )}
      </section>

    </div>
  );
}
