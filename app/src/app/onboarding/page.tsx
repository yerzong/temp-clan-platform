import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { ProfileService } from "@/features/profile/profile-service";
import { OnboardingForm } from "@/features/profile/components/onboarding-form";
import { BrandMark } from "@/components/layout/brand-mark";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  // No org yet → the dashboard handles org creation first.
  if (!ctx.ok || !ctx.data) redirect("/dashboard");

  const res = await new ProfileService(supabase).getMyProfile(
    ctx.data.organization.id,
    user.id
  );
  // Already onboarded (privacy accepted) → straight to the dashboard.
  if (res.ok && res.data?.privacyAccepted) redirect("/dashboard");

  const profile = res.ok ? res.data : null;

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark />
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--tc-accent-hover))]">
              <span className="h-1 w-4 rounded-full bg-[hsl(var(--tc-accent))] shadow-[0_0_6px_hsl(var(--tc-accent))]" />
              Bienvenido
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-tc-fg">
              Completa tu perfil
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-tc-fg-tertiary">
              Trajimos lo que pudimos de tu cuenta de Discord. Revisa tus datos,
              completa lo que falte y acepta el aviso de privacidad para entrar.
            </p>
          </div>
        </div>

        {profile ? (
          <div className="rounded-xl border border-tc-border bg-card p-6">
            <OnboardingForm profile={profile} />
          </div>
        ) : (
          <p className="text-center text-sm text-tc-fg-muted">
            No se pudo cargar tu perfil. Recarga la página.
          </p>
        )}
      </div>
    </main>
  );
}
