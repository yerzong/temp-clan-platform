import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService } from "@/features/invitations/invitation-service";
import { InviteManager } from "@/features/invitations/components/invite-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div>
      <PageHeader
        eyebrow="Acceso"
        title="Invitaciones"
        subtitle={`Crea enlaces configurables para que la gente se una a ${ctx.data.organization.name} con Discord. Define el rol, los usos y cuándo expira.`}
      />

      {invites.ok === false ? (
        <Card>
          <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
            No se pudieron cargar las invitaciones: {invites.error}
          </CardContent>
        </Card>
      ) : (
        <InviteManager invitations={invites.data} />
      )}
    </div>
  );
}
