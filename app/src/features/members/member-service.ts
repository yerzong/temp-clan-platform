import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member, Result, MemberRole } from "@/lib/domain/types";

/**
 * Member service — owns member-level data access: listing and adding members
 * within an organization. Single responsibility: members (orgs live in
 * OrganizationService).
 */
export class MemberService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** All members of an organization, newest first. */
  async listMembers(orgId: string): Promise<Result<Member[]>> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select(
        "id, role, status, member_profiles ( display_name, avatar_url, is_creator, is_player, bio )"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const members: Member[] = (data ?? []).map((row) => {
      const profile = (row.member_profiles ?? {}) as {
        display_name?: string;
        avatar_url?: string | null;
        is_creator?: boolean;
        is_player?: boolean;
        bio?: string | null;
      };
      return {
        membershipId: row.id as string,
        role: row.role as MemberRole,
        status: row.status as Member["status"],
        displayName: profile.display_name ?? "Unnamed",
        avatarUrl: profile.avatar_url ?? null,
        isCreator: profile.is_creator ?? false,
        isPlayer: profile.is_player ?? false,
        bio: profile.bio ?? null,
      };
    });

    return { ok: true, data: members };
  }

  /** Add a manual member record (roster entry; not a login invite). */
  async addMember(
    orgId: string,
    input: {
      displayName: string;
      role: MemberRole;
      isCreator: boolean;
      isPlayer: boolean;
    }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("add_org_member", {
      target_org: orgId,
      p_display_name: input.displayName,
      p_role: input.role,
      p_is_creator: input.isCreator,
      p_is_player: input.isPlayer,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Update a member's role and profile attributes. */
  async updateMember(
    membershipId: string,
    input: {
      displayName: string;
      role: MemberRole;
      isCreator: boolean;
      isPlayer: boolean;
    }
  ): Promise<Result<null>> {
    // Guard: do not allow changing the owner's role away from owner.
    const { data: current, error: readError } = await this.supabase
      .from("memberships")
      .select("role")
      .eq("id", membershipId)
      .single();

    if (readError) return { ok: false, error: readError.message };
    if (current.role === "owner" && input.role !== "owner") {
      return { ok: false, error: "You cannot change the owner's role." };
    }

    const { error: roleError } = await this.supabase
      .from("memberships")
      .update({ role: input.role })
      .eq("id", membershipId);
    if (roleError) return { ok: false, error: roleError.message };

    const { error: profileError } = await this.supabase
      .from("member_profiles")
      .update({
        display_name: input.displayName,
        is_creator: input.isCreator,
        is_player: input.isPlayer,
      })
      .eq("membership_id", membershipId);
    if (profileError) return { ok: false, error: profileError.message };

    return { ok: true, data: null };
  }

  /** Remove a member. Refuses to delete the organization owner. */
  async deleteMember(membershipId: string): Promise<Result<null>> {
    const { data: current, error: readError } = await this.supabase
      .from("memberships")
      .select("role")
      .eq("id", membershipId)
      .single();

    if (readError) return { ok: false, error: readError.message };
    if (current.role === "owner") {
      return { ok: false, error: "You cannot remove the owner." };
    }

    const { error } = await this.supabase
      .from("memberships")
      .delete()
      .eq("id", membershipId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }
}
