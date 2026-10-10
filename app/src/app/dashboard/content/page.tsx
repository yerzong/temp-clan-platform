import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { ContentService } from "@/features/content/content-service";
import { CreateContentForm } from "@/features/content/components/create-content-form";
import { TwitchImport } from "@/features/content/components/twitch-import";
import { HighlightsFinder } from "@/features/content/components/highlights-finder";
import { ContentBoard } from "@/features/content/components/content-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Clapperboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
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
  const [contentRes, membersRes] = await Promise.all([
    new ContentService(supabase).listContent(orgId),
    new MemberService(supabase).listMembers(orgId),
  ]);

  const pieces = contentRes.ok ? contentRes.data : [];
  const creators = (membersRes.ok ? membersRes.data : []).filter(
    (m) => m.isCreator
  );

  const published = pieces.filter((p) => p.status === "published").length;
  const inProgress = pieces.filter(
    (p) => p.status === "editing" || p.status === "review"
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Pipeline de contenido"
        subtitle="Rastrea clips de idea a publicado. Importa VODs de Twitch o trae los mejores highlights de un canal."
        actions={
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
            <StatTile label="Total" value={pieces.length} tone="accent" />
            <StatTile label="En progreso" value={inProgress} />
            <StatTile label="Publicados" value={published} />
          </div>
        }
      />

      {/* Add content — collapsible panel so the board below gets full width */}
      <details className="group mb-6 rounded-lg border border-tc-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div className="flex flex-col">
            <span className="font-semibold text-tc-fg">Agregar contenido</span>
            <span className="text-sm text-tc-fg-tertiary">
              Rastrea un clip o video por el pipeline.
            </span>
          </div>
          <span className="rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors group-hover:border-tc-accent group-hover:text-tc-fg group-open:hidden">
            + Nuevo
          </span>
          <span className="hidden rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary group-open:inline">
            Cerrar
          </span>
        </summary>
        <div className="border-t border-tc-border-soft p-5">
          <div className="max-w-md">
            <CreateContentForm creators={creators} />
          </div>
        </div>
      </details>

      {/* Import from Twitch — collapsible panel */}
      <details className="group mb-6 rounded-lg border border-tc-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div className="flex flex-col">
            <span className="font-semibold text-tc-fg">Importar de Twitch</span>
            <span className="text-sm text-tc-fg-tertiary">
              Trae los VODs recientes de un canal al pipeline.
            </span>
          </div>
          <span className="rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors group-hover:border-tc-accent group-hover:text-tc-fg group-open:hidden">
            Conectar
          </span>
          <span className="hidden rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary group-open:inline">
            Cerrar
          </span>
        </summary>
        <div className="border-t border-tc-border-soft p-5">
          <div className="max-w-xl">
            <TwitchImport />
          </div>
        </div>
      </details>

      {/* Find highlights — collapsible panel */}
      <details className="group mb-6 rounded-lg border border-tc-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-2 font-semibold text-tc-fg">
              Buscar highlights
              <span className="rounded bg-[hsl(var(--tc-accent)/0.14)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--tc-accent-hover))]">
                beta
              </span>
            </span>
            <span className="text-sm text-tc-fg-tertiary">
              Muestra los clips más vistos de un canal como candidatos a
              highlight.
            </span>
          </div>
          <span className="rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary transition-colors group-hover:border-tc-accent group-hover:text-tc-fg group-open:hidden">
            Abrir
          </span>
          <span className="hidden rounded-md border border-tc-border bg-tc-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-tc-fg-secondary group-open:inline">
            Cerrar
          </span>
        </summary>
        <div className="border-t border-tc-border-soft p-5">
          <HighlightsFinder />
          <p className="mt-4 text-[11px] leading-relaxed text-tc-fg-muted">
            Los highlights se ordenan por las vistas de los clips — la señal de
            la propia comunidad sobre los mejores momentos. El análisis de video
            con IA puede venir después.
          </p>
        </div>
      </details>

      {/* Board — full width */}
      {contentRes.ok === false ? (
        <Card>
          <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
            No se pudo cargar el contenido: {contentRes.error}
          </CardContent>
        </Card>
      ) : pieces.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="h-4 w-4" />}
          title="Sin contenido aún"
          description="Abre “Agregar contenido” arriba para iniciar el pipeline."
        />
      ) : (
        <ContentBoard pieces={pieces} />
      )}
    </div>
  );
}
