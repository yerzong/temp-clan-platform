import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { AssignToTeamForm } from "@/features/esports/components/assign-to-team-form";
import { RosterPlayerRow } from "@/features/esports/components/roster-player-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { RosterPlayer } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
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

  const [teamRes, membersRes] = await Promise.all([
    esports.getTeam(teamId),
    new MemberService(supabase).listMembers(orgId),
  ]);

  if (!teamRes.ok) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
          No se pudo cargar el equipo: {teamRes.error}
        </CardContent>
      </Card>
    );
  }
  if (!teamRes.data) notFound();

  const team = teamRes.data;

  // Players not already on this team's roster.
  const onRoster = new Set(team.roster.map((r) => r.membershipId));
  const available: RosterPlayer[] = (membersRes.ok ? membersRes.data : [])
    .filter((m) => m.isPlayer && !onRoster.has(m.membershipId))
    .map((m) => ({
      slotId: m.membershipId,
      membershipId: m.membershipId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      position: null,
    }));

  return (
    <div>
      <Link
        href="/dashboard/esports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-tc-fg-tertiary transition-colors hover:text-tc-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Equipos
      </Link>

      <PageHeader
        eyebrow="Equipo"
        title={team.name}
        subtitle="Gestiona el roster de este equipo: asigna o quita jugadores."
        actions={
          <div className="flex items-center gap-3">
            <Badge>{team.format}</Badge>
            <span className="flex items-center gap-1.5 text-tc-fg-tertiary">
              <Users className="h-4 w-4" />
              <span className="font-mono text-sm tabular-nums">
                {team.rosterCount}
              </span>
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Roster */}
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Roster
          </h2>
          {team.roster.length === 0 ? (
            <EmptyState
              icon={<Users className="h-4 w-4" />}
              title="Roster vacío"
              description="Asigna jugadores a este equipo desde el panel de la derecha."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {team.roster.map((p) => (
                <RosterPlayerRow key={p.slotId} player={p} />
              ))}
            </div>
          )}
        </section>

        {/* Assign */}
        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Asignar al roster</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Suma un jugador a {team.name}.
              </p>
            </CardHeader>
            <CardContent>
              <AssignToTeamForm teamId={team.id} players={available} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
