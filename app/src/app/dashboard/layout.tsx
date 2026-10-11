import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { NotificationService } from "@/features/notifications/notification-service";
import { ProfileService } from "@/features/profile/profile-service";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { AppShell } from "@/components/layout/app-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ProfileMenuButton } from "@/components/layout/profile-menu-button";
import { SideNav, type NavItem } from "@/components/layout/side-nav";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Resumen", icon: "overview" },
  { href: "/dashboard/members", label: "Miembros", icon: "members" },
  { href: "/dashboard/esports", label: "Esports", icon: "esports" },
  { href: "/dashboard/content", label: "Contenido", icon: "content" },
  { href: "/dashboard/league", label: "Temp League", icon: "league" },
  { href: "/dashboard/invitations", label: "Invitaciones", icon: "invitations" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Commander";

  const ctx = await new OrganizationService(supabase).getCurrentOrgContext(
    user.id
  );
  const orgName = ctx.ok && ctx.data ? ctx.data.organization.name : null;

  // Onboarding gate: if the user has a profile in an org but hasn't accepted
  // the privacy notice yet, send them to complete their profile first.
  if (ctx.ok && ctx.data) {
    const prof = await new ProfileService(supabase).getMyProfile(
      ctx.data.organization.id,
      user.id
    );
    if (prof.ok && prof.data && !prof.data.privacyAccepted) {
      redirect("/onboarding");
    }
  }

  const notifRes = await new NotificationService(supabase).list();
  const notifications = notifRes.ok ? notifRes.data : [];
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <AppShell
      actions={
        <div className="flex items-center gap-2">
          <NotificationBell notifications={notifications} userId={user.id} />
          <ProfileMenuButton name={userName} avatarUrl={avatarUrl} />
          <SignOutButton />
        </div>
      }
      nav={<SideNav items={NAV} />}
      topLeft={
        orgName ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-tc-fg-muted">
              Organización
            </span>
            <span className="truncate font-medium text-tc-fg">{orgName}</span>
          </div>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
