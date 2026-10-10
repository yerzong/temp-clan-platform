import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { MembersRoster } from "@/features/members/components/members-roster";
import { AddMemberForm } from "@/features/members/components/add-member-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orgService = new OrganizationService(supabase);
  const ctx = await orgService.getCurrentOrgContext(user.id);

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

  const orgId = ctx.data.organization.id;
  const membersRes = await new MemberService(supabase).listMembers(orgId);
  const members = membersRes.ok ? membersRes.data : [];

  const playerCount = members.filter((m) => m.isPlayer).length;
  const creatorCount = members.filter((m) => m.isCreator).length;

  return (
    <div>
      <PageHeader
        eyebrow="Miembros"
        title="Roster de la organización"
        subtitle="Tu plantilla completa, agrupada por rol. Agrega staff, jugadores o creadores y gestiona cada perfil desde aquí."
        actions={
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
            <StatTile label="Miembros" value={members.length} tone="accent" />
            <StatTile label="Jugadores" value={playerCount} />
            <StatTile label="Creadores" value={creatorCount} />
          </div>
        }
      />

      {membersRes.ok === false ? (
        <Card>
          <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
            No se pudieron cargar los miembros: {membersRes.error}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <MembersRoster members={members} />

          <aside>
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-base">Agregar miembro</CardTitle>
                <p className="text-sm text-tc-fg-tertiary">
                  Registra staff, jugadores o creadores.
                </p>
              </CardHeader>
              <CardContent>
                <AddMemberForm />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
