import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { SlotCard } from "@/features/esports/components/slot-card";
import { AddSlotCard } from "@/features/esports/components/add-slot-card";
import { TeamActions } from "@/features/esports/components/team-actions";
import { GAME_LABELS } from "@/features/esports/components/team-list";
import { Card, CardContent } from "@/components/ui/card";
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
  const captain = team.slots.find((s) => s.isCaptain) ?? null;
  const canVerify = ctx.data.role === "owner" || ctx.data.role === "admin";

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
      username: m.username,
      email: m.email,
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
        subtitle="Gestiona los slots del equipo: renómbralos, asigna jugadores y marca al responsable."
        actions={<TeamActions team={team} />}
      />

      {/* Team metrics */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TeamMetric label="Titulares" value={`${team.rosterCount}/${team.maxSlots}`} />
        <TeamMetric label="Vacantes" value={team.maxSlots - team.rosterCount} />
        <TeamMetric
          label="Responsable"
          value={captain ? captain.displayName ?? "—" : "Sin asignar"}
          tone={captain ? "accent" : "neutral"}
        />
        <TeamMetric label="Juego" value={GAME_LABELS[team.game] ?? team.game} />
      </div>

      <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
        Roster
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {team.slots.map((slot) => (
          <SlotCard
            key={slot.slotId}
            slot={slot}
            available={available}
            canVerify={canVerify}
          />
        ))}
        <AddSlotCard teamId={team.id} />
      </div>
    </div>
  );
}

function TeamMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-tc-border bg-card px-4 py-3">
      <span
        aria-hidden
        className={
          tone === "accent"
            ? "absolute inset-y-0 left-0 w-0.5 bg-[hsl(var(--tc-accent))]"
            : "absolute inset-y-0 left-0 w-0.5 bg-tc-border-strong"
        }
      />
      <div className="flex flex-col gap-1 pl-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-tc-fg-muted">
          {label}
        </span>
        <span className="truncate font-mono text-lg font-semibold tabular-nums text-tc-fg">
          {value}
        </span>
      </div>
    </div>
  );
}
