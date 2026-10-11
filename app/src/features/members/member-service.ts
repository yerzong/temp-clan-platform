import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member, Result, MemberRole } from "@/lib/domain/types";

/** Member functions + admin permission used by add/update. */
export interface MemberFunctions {
  displayName: string;
  isStaff: boolean;
  isPlayer: boolean;
  isCreator: boolean;
  isAdmin: boolean;
}

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
        "id, user_id, role, status, member_profiles ( display_name, username, email, avatar_url, is_staff, is_creator, is_player, bio )"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const members: Member[] = (data ?? []).map((row) => {
      const profile = (row.member_profiles ?? {}) as {
        display_name?: string;
        username?: string | null;
        email?: string | null;
        avatar_url?: string | null;
        is_staff?: boolean;
        is_creator?: boolean;
        is_player?: boolean;
        bio?: string | null;
      };
      const role = row.role as MemberRole;
      return {
        membershipId: row.id as string,
        role,
        isAdmin: role === "admin" || role === "owner",
        isOwner: role === "owner",
        status: row.status as Member["status"],
        displayName: profile.display_name ?? "Unnamed",
        username: profile.username ?? null,
        email: profile.email ?? null,
        avatarUrl: profile.avatar_url ?? null,
        isStaff: profile.is_staff ?? false,
        isCreator: profile.is_creator ?? false,
        isPlayer: profile.is_player ?? false,
        bio: profile.bio ?? null,
        // A linked member has a real auth account behind the membership.
        isLinked: row.user_id != null,
      };
    });

    return { ok: true, data: members };
  }

  /** Add a manual member (roster entry) with functions + admin permission. */
  async addMember(
    orgId: string,
    input: MemberFunctions
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("add_org_member", {
      target_org: orgId,
      p_display_name: input.displayName,
      p_is_staff: input.isStaff,
      p_is_player: input.isPlayer,
      p_is_creator: input.isCreator,
      p_is_admin: input.isAdmin,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Update a member's name, functions and admin permission (admin only). */
  async updateMember(
    membershipId: string,
    input: MemberFunctions
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("admin_update_member", {
      p_membership_id: membershipId,
      p_display_name: input.displayName,
      p_is_staff: input.isStaff,
      p_is_player: input.isPlayer,
      p_is_creator: input.isCreator,
      p_is_admin: input.isAdmin,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Admin edits a member's full profile (contact + identity fields). */
  async updateMemberProfile(
    membershipId: string,
    input: {
      username: string;
      email: string;
      birthDate: string | null;
      nationality: string;
      phone: string;
      avatarUrl: string;
    }
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("admin_update_member_profile", {
      p_membership_id: membershipId,
      p_username: input.username,
      p_email: input.email,
      p_birth_date: input.birthDate,
      p_nationality: input.nationality,
      p_phone: input.phone,
      p_avatar_url: input.avatarUrl,
    });
    if (error) return { ok: false, error: error.message };
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

    const { data: deleted, error } = await this.supabase
      .from("memberships")
      .delete()
      .eq("id", membershipId)
      .select("id");

    if (error) return { ok: false, error: error.message };
    if (!deleted || deleted.length === 0) {
      return { ok: false, error: "No se pudo eliminar el miembro (permisos)." };
    }
    return { ok: true, data: null };
  }
}
