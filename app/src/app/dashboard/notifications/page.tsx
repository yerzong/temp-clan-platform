import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/features/notifications/notification-service";
import { NotificationLog } from "@/features/notifications/components/notification-log";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const res = await new NotificationService(supabase).listAll();

  return (
    <div>
      <PageHeader
        eyebrow="Actividad"
        title="Bitácora de notificaciones"
        subtitle="El historial completo de eventos de tu organización. Aquí puedes eliminar notificaciones de forma permanente."
      />

      {res.ok === false ? (
        <Card>
          <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
            No se pudo cargar la bitácora: {res.error}
          </CardContent>
        </Card>
      ) : (
        <NotificationLog notifications={res.data} />
      )}
    </div>
  );
}
