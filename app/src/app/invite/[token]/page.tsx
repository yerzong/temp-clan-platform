import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InvitationService } from "@/features/invitations/invitation-service";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in: send to login, then back to this invite link.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <BrandMark />
          <Card className="w-full">
            <CardContent className="flex flex-col items-center gap-5 p-7 text-center">
              <h1 className="text-xl font-semibold tracking-tight text-tc-fg">
                Has sido invitado
              </h1>
              <p className="text-sm text-tc-fg-tertiary">
                Inicia sesión con Discord para unirte a la organización.
              </p>
              <Button asChild className="w-full">
                <Link href={`/login?next=/invite/${token}`}>
                  Continuar con Discord
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Signed in: redeem the token.
  const result = await new InvitationService(supabase).redeemInvitation(token);

  if (!result.ok) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <BrandMark />
          <Card className="w-full">
            <CardContent className="flex flex-col items-center gap-5 p-7 text-center">
              <h1 className="text-lg font-semibold text-tc-fg">
                Problema con la invitación
              </h1>
              <p className="text-sm text-[hsl(var(--tc-destructive))]">
                {result.error}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Ir al panel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  redirect("/dashboard");
}
