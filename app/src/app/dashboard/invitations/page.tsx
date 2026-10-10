import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService } from "@/features/invitations/invitation-service";
import { CreateInviteForm } from "@/features/invitations/components/create-invite-form";
import { InviteList } from "@/features/invitations/components/invite-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
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

  const invites = await new InvitationService(supabase).listInvitations(
    ctx.data.organization.id
  );
  const list = invites.ok ? invites.data : [];

  return (
    <div>
      <PageHeader
        eyebrow="Acceso"
        title="Invitaciones"
        subtitle={`Invita personas a unirse a ${ctx.data.organization.name} con su cuenta de Discord.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Enlaces de invitación
          </h2>
          {invites.ok === false ? (
            <Card>
              <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
                No se pudieron cargar las invitaciones: {invites.error}
              </CardContent>
            </Card>
          ) : (
            <InviteList invitations={list} />
          )}
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Nueva invitación</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Elige un rol, luego comparte el enlace.
              </p>
            </CardHeader>
            <CardContent>
              <CreateInviteForm />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
