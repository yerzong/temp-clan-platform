import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { TeamList } from "@/features/esports/components/team-list";
import { CreateTeamPanel } from "@/features/esports/components/create-team-panel";
import { CheckinForm } from "@/features/esports/components/checkin-form";
import { WellbeingPanel } from "@/features/esports/components/wellbeing-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { PageHeader } from "@/components/layout/page-header";
import type { RosterPlayer } from "@/lib/domain/types";

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

  const [teamsRes, wellbeingRes, membersRes, coversRes] = await Promise.all([
    esports.listTeams(orgId),
    esports.getPlayerWellbeing(orgId),
    members.listMembers(orgId),
    esports.getGameCovers(),
  ]);

  const teams = teamsRes.ok ? teamsRes.data : [];
  const wellbeing = wellbeingRes.ok ? wellbeingRes.data : [];
  const covers = coversRes.ok ? coversRes.data : {};

  const playerOptions: RosterPlayer[] = (membersRes.ok ? membersRes.data : [])
    .filter((m) => m.isPlayer)
    .map((m) => ({
      slotId: m.membershipId,
      membershipId: m.membershipId,
      displayName: m.displayName,
      username: m.username,
      email: m.email,
      avatarUrl: m.avatarUrl,
      position: null,
    }));

  return (
    <div>
      <PageHeader
        eyebrow="Esports"
        title="Equipos y sostenibilidad"
        subtitle="Crea squads y entra a cada equipo para armar su roster. Registra check-ins de bienestar para detectar el burnout a tiempo."
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

      {/* Wellbeing / sustainability */}
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Sostenibilidad del jugador
          </h2>
          <WellbeingPanel players={wellbeing} />
        </div>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Check-in de bienestar</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Registra cómo está un jugador hoy (ánimo, descanso, horas de
                práctica) para seguir su carga y evitar el burnout.
              </p>
            </CardHeader>
            <CardContent>
              <CheckinForm players={playerOptions} />
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
