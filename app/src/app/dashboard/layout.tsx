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
    <AppShell userName={userName} actions={<SignOutButton />}>
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <aside className="md:border-r md:border-tc-border-soft md:pr-4">
          <SideNav items={NAV} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </AppShell>
  );
}
