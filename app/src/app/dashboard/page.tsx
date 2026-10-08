import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { CreateOrgForm } from "@/features/organizations/components/create-org-form";
import { RosterPanel } from "@/features/members/components/roster-panel";
import { AppShell } from "@/components/layout/app-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const orgService = new OrganizationService(supabase);
  const ctx = await orgService.getCurrentOrgContext(user.id);

  // --- Error state ---
  if (!ctx.ok) {
    return (
      <AppShell userName={userName} actions={<SignOutButton />}>
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6 text-center text-sm text-[hsl(var(--tc-destructive))]">
            Could not load your organization: {ctx.error}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // --- Empty state: onboarding ---
  if (!ctx.data) {
    return (
      <AppShell userName={userName} actions={<SignOutButton />}>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Create your organization</CardTitle>
            <p className="text-sm text-tc-fg-tertiary">
              Set up your command center to begin.
            </p>
          </CardHeader>
          <CardContent>
            <CreateOrgForm />
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const { organization, role } = ctx.data;
  const memberService = new MemberService(supabase);
  const members = await memberService.listMembers(organization.id);
  const list = members.ok ? members.data : [];

  return (
    <AppShell userName={userName} actions={<SignOutButton />}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-tc-border-soft pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-tc-fg-muted">
            Organization · you are {role}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-tc-fg">
            {organization.name}
          </h1>
        </div>
        <div className="flex gap-6">
          <Stat label="Members" value={list.length} />
          <Stat label="Players" value={list.filter((m) => m.isPlayer).length} />
          <Stat
            label="Creators"
            value={list.filter((m) => m.isCreator).length}
          />
        </div>
      </div>

      <RosterPanel members={members} />
    </AppShell>
  );
}
