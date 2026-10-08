import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { InvitationService } from "@/features/invitations/invitation-service";
import { CreateInviteForm } from "@/features/invitations/components/create-invite-form";
import { InviteList } from "@/features/invitations/components/invite-list";
import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader
        eyebrow="Access"
        title="Invitations"
        subtitle={`Invite people to join ${ctx.data.organization.name} with their Discord account.`}
      />

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
