import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { LiveService } from "@/features/live/live-service";
import { LiveStreamCard } from "@/features/live/components/live-stream-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );

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
        <CardContent className="p-6 text-center text-sm text-tc-fg-tertiary">
          Primero crea tu organización (pestaña Resumen).
        </CardContent>
      </Card>
    );
  }

  const liveRes = await new LiveService(supabase).listLive(
    ctx.data.organization.id
  );
  const streams = liveRes.ok ? liveRes.data : [];
  const totalViewers = streams.reduce((sum, s) => sum + s.viewerCount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="En vivo ahora"
        title="Transmisiones en directo"
        subtitle="Quién de tu organización está transmitiendo en este momento. Se detectan automáticamente los canales de Twitch vinculados en cada perfil."
        actions={
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[260px]">
            <StatTile
              label="En vivo"
              value={streams.length}
              tone={streams.length > 0 ? "accent" : "neutral"}
            />
            <StatTile label="Espectadores" value={totalViewers} />
          </div>
        }
      />

      {liveRes.ok === false ? (
        <Card>
          <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
            No se pudieron cargar las transmisiones: {liveRes.error}
          </CardContent>
        </Card>
      ) : streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tc-surface-2 text-tc-fg-muted">
              <Radio className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-tc-fg-secondary">
              Nadie está en vivo ahora mismo
            </p>
            <p className="max-w-sm text-xs text-tc-fg-tertiary">
              Cuando un miembro con su canal de Twitch vinculado empiece a
              transmitir, aparecerá aquí automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="tc-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <LiveStreamCard key={stream.membershipId} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}
