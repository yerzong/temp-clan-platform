import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgContext, Result, MemberRole } from "@/lib/domain/types";

/**
 * Organization service — owns organization-level data access: reading the
 * current user's org context and creating organizations. Single responsibility:
 * organizations, not members (see MemberService for that).
 */
export class OrganizationService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** The current user's org context, or null if they have no active org. */
  async getCurrentOrgContext(
    userId: string
  ): Promise<Result<OrgContext | null>> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select("role, organizations ( id, name, slug, logo_url, plan )")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data || !data.organizations) return { ok: true, data: null };

    const org = data.organizations as unknown as {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      plan: string;
    };

    return {
      ok: true,
      data: {
        role: data.role as MemberRole,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logo_url,
          plan: org.plan,
        },
      },
    };
  }

  /** Create an org atomically via the DB function; caller becomes owner. */
  async createOrganization(name: string, slug: string): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("create_organization", {
      org_name: name,
      org_slug: slug,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "That slug is already taken. Try another." };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as string };
  }
}
