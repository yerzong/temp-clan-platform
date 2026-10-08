import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { CreateOrgForm } from "@/features/organizations/components/create-org-form";
import { RosterPanel } from "@/features/members/components/roster-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
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
          Could not load your organization: {ctx.error}
        </CardContent>
      </Card>
    );
  }

  if (!ctx.data) {
    return (
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
    );
  }

  const { organization, role } = ctx.data;
  const memberService = new MemberService(supabase);
  const members = await memberService.listMembers(organization.id);
  const list = members.ok ? members.data : [];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-tc-border-soft pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-tc-fg-muted">
            Organization · you are {role}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-tc-fg">
            {organization.name}
          </h1>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
          <StatTile label="Members" value={list.length} tone="accent" />
          <StatTile
            label="Players"
            value={list.filter((m) => m.isPlayer).length}
          />
          <StatTile
            label="Creators"
            value={list.filter((m) => m.isCreator).length}
          />
        </div>
      </div>

      <RosterPanel members={members} />
    </div>
  );
}
