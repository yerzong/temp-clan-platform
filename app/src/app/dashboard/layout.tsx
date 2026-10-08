import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <AppShell
      userName={userName}
      actions={<SignOutButton />}
      nav={<SideNav items={NAV} />}
    >
      {children}
    </AppShell>
  );
}
