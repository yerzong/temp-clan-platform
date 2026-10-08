import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService } from "@/features/invitations/invitation-service";
import { CreateInviteForm } from "@/features/invitations/components/create-invite-form";
import { InviteList } from "@/features/invitations/components/invite-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
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
          Create your organization first (Overview tab).
        </CardContent>
      </Card>
    );
  }

  const invites = await new InvitationService(supabase).listInvitations(
    ctx.data.organization.id
  );
  const list = invites.ok ? invites.data : [];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b border-tc-border-soft pb-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-tc-fg-muted">
          Access
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-tc-fg">
          Invitations
        </h1>
        <p className="mt-1 text-sm text-tc-fg-tertiary">
          Invite people to join {ctx.data.organization.name} with their Discord
          account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
            Invite links
          </h2>
          {invites.ok === false ? (
            <Card>
              <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
                Could not load invitations: {invites.error}
              </CardContent>
            </Card>
          ) : (
            <InviteList invitations={list} />
          )}
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">New invitation</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Pick a role, then share the link.
              </p>
            </CardHeader>
            <CardContent>
              <CreateInviteForm />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
