import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "@/features/organizations/organization-service";
import { MemberService } from "@/features/members/member-service";
import { ContentService } from "@/features/content/content-service";
import { CreateContentForm } from "@/features/content/components/create-content-form";
import { ContentBoard } from "@/features/content/components/content-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { Clapperboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
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

  const orgId = ctx.data.organization.id;
  const [contentRes, membersRes] = await Promise.all([
    new ContentService(supabase).listContent(orgId),
    new MemberService(supabase).listMembers(orgId),
  ]);

  const pieces = contentRes.ok ? contentRes.data : [];
  const creators = (membersRes.ok ? membersRes.data : []).filter(
    (m) => m.isCreator
  );

  const published = pieces.filter((p) => p.status === "published").length;
  const inProgress = pieces.filter(
    (p) => p.status === "editing" || p.status === "review"
  ).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-tc-border-soft pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-tc-fg-muted">
            Content
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-tc-fg">
            Content pipeline
          </h1>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[380px]">
          <StatTile label="Total" value={pieces.length} tone="accent" />
          <StatTile label="In progress" value={inProgress} />
          <StatTile label="Published" value={published} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          {contentRes.ok === false ? (
            <Card>
              <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
                Could not load content: {contentRes.error}
              </CardContent>
            </Card>
          ) : pieces.length === 0 ? (
            <EmptyState
              icon={<Clapperboard className="h-4 w-4" />}
              title="No content yet"
              description="Add your first clip or video on the right to start the pipeline."
            />
          ) : (
            <ContentBoard pieces={pieces} />
          )}
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Add content</CardTitle>
              <p className="text-sm text-tc-fg-tertiary">
                Track a clip or video through the pipeline.
              </p>
            </CardHeader>
            <CardContent>
              <CreateContentForm creators={creators} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
