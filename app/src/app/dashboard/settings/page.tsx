import { redirect } from "next/navigation";
import { Plug, Swords, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { OrgDiscordSettings } from "@/features/organizations/components/org-discord-settings";
import { OpponentsManager } from "@/features/organizations/components/opponents-manager";
import { DemoTeamButton } from "@/features/organizations/components/demo-team-button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tc-surface-2 text-[hsl(var(--tc-accent-hover))]">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-tc-fg">{title}</h2>
            <p className="text-xs text-tc-fg-tertiary">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orgService = new OrganizationService(supabase);
  const ctx = await orgService.getCurrentOrgContext(user.id);

  if (!ctx.ok || !ctx.data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-tc-fg-tertiary">
          Primero crea tu organización (pestaña Resumen).
        </CardContent>
      </Card>
    );
  }

  const { organization, role } = ctx.data;
  const canManage = role === "owner" || role === "admin";

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-tc-fg-tertiary">
          Solo el dueño o los administradores pueden ver los ajustes.
        </CardContent>
      </Card>
    );
  }

  const opponentsRes = await orgService.listOpponents(organization.id);
  const opponents = opponentsRes.ok ? opponentsRes.data : [];

  return (
    <div>
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración de la organización"
        subtitle="Conecta Discord y registra a los rivales que usan todos los equipos."
      />

      <div className="flex flex-col gap-4">
        <Section
          icon={Plug}
          title="Discord"
          description="Anuncia las convocatorias de todos los equipos en tu servidor."
        >
          <OrgDiscordSettings
            connected={organization.hasDiscordWebhook}
            notifyDefault={organization.discordNotifyDefault}
          />
        </Section>

        <Section
          icon={Swords}
          title="Rivales"
          description="Equipos rivales compartidos por toda la organización. Al agendar los eliges del buscador."
        >
          <OpponentsManager opponents={opponents} />
        </Section>

        <Section
          icon={Sparkles}
          title="Datos de ejemplo"
          description="Genera un equipo de prueba para ver cómo luce todo con información completa."
        >
          <DemoTeamButton />
        </Section>
      </div>
    </div>
  );
}
