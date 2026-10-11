import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { ProfileService } from "@/features/profile/profile-service";
import { ProfileEditor } from "@/features/profile/components/profile-editor";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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

  const res = await new ProfileService(supabase).getMyProfile(
    ctx.data.organization.id,
    user.id
  );

  return (
    <div>
      <PageHeader
        eyebrow="Mi perfil"
        title="Perfil"
        subtitle="Tu información personal y tus cuentas vinculadas (redes sociales y cuentas de juego)."
      />

      {res.ok === false || !res.data ? (
        <Card>
          <CardContent className="p-6 text-sm text-tc-fg-tertiary">
            No se pudo cargar tu perfil.
          </CardContent>
        </Card>
      ) : (
        <ProfileEditor profile={res.data} />
      )}
    </div>
  );
}
