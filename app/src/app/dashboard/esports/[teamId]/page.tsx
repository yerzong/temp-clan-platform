import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { SlotCard } from "@/features/esports/components/slot-card";
import { GAME_LABELS } from "@/features/esports/components/team-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
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

  // Players not already in a slot on this team.
  const onTeam = new Set(
    team.slots.map((s) => s.membershipId).filter(Boolean) as string[]
  );
  const available: RosterPlayer[] = (membersRes.ok ? membersRes.data : [])
    .filter((m) => m.isPlayer && !onTeam.has(m.membershipId))
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
        eyebrow={GAME_LABELS[team.game] ?? team.game}
        title={team.name}
        subtitle="Gestiona los slots del equipo: renómbralos, asigna jugadores y marca al capitán."
        actions={
          <div className="flex items-center gap-3">
            {team.platform && <Badge>{team.platform}</Badge>}
            <span className="flex items-center gap-1.5 text-tc-fg-tertiary">
              <Users className="h-4 w-4" />
              <span className="font-mono text-sm tabular-nums">
                {team.rosterCount}/{team.maxSlots}
              </span>
            </span>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.slots.map((slot) => (
          <SlotCard key={slot.slotId} slot={slot} available={available} />
        ))}
      </div>
    </div>
  );
}
