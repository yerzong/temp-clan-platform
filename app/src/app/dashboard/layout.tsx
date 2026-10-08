import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { AppShell } from "@/components/layout/app-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { SideNav, type NavItem } from "@/components/layout/side-nav";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/esports", label: "Esports", icon: "esports" },
  { href: "/dashboard/content", label: "Content", icon: "content" },
  { href: "/dashboard/league", label: "Temp League", icon: "league" },
  { href: "/dashboard/invitations", label: "Invitations", icon: "invitations" },
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

  return (
    <AppShell
      userName={userName}
      actions={<SignOutButton />}
      nav={<SideNav items={NAV} />}
      topLeft={
        orgName ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-tc-fg-muted">
              Org
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
