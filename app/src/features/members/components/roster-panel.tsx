import type { Member, Result } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberCard } from "./member-card";
import { AddMemberForm } from "./add-member-form";

/**
 * Roster panel: lists members and provides the add-member form. Handles every
 * state (error / empty / populated). Self-contained feature view.
 */
export function RosterPanel({ members }: { members: Result<Member[]> }) {
  const list = members.ok ? members.data : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Roster list */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tc-fg-tertiary">
          Roster
        </h2>

        {members.ok === false ? (
          <Card>
            <CardContent className="p-6 text-sm text-[hsl(var(--tc-destructive))]">
              Could not load members: {members.error}
            </CardContent>
          </Card>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-tc-fg-tertiary">
              No members yet. Add your first operator on the right.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((m) => (
              <MemberCard key={m.membershipId} member={m} />
            ))}
          </div>
        )}
      </section>

      {/* Add member */}
      <aside>
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Add operator</CardTitle>
            <p className="text-sm text-tc-fg-tertiary">
              Register staff, players, or creators.
            </p>
          </CardHeader>
          <CardContent>
            <AddMemberForm />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
