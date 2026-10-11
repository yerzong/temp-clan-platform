import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberProfile, LinkedAccount, Result } from "@/lib/domain/types";

interface AccountRow {
  id: string;
  platform: string;
  kind: string;
  handle: string;
  url: string | null;
  verified: boolean;
}

function mapAccounts(rows: AccountRow[] | null | undefined): LinkedAccount[] {
  return (rows ?? []).map((a) => ({
    id: a.id,
    platform: a.platform,
    kind: (a.kind as LinkedAccount["kind"]) ?? "social",
    handle: a.handle,
    url: a.url,
    verified: Boolean(a.verified),
  }));
}

/**
 * Profile service — reads a member's full profile (with linked accounts) by
 * membership id. Writes go through the SECURITY DEFINER RPCs (self-service for
 * the owner, admin-only for verification).
 */
export class ProfileService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** Full profile for a membership (used by the view-profile modal and page). */
  async getProfile(membershipId: string): Promise<Result<MemberProfile | null>> {
    const { data, error } = await this.supabase
      .from("member_profiles")
      .select(
        "membership_id, display_name, username, email, avatar_url, birth_date, nationality, phone, privacy_accepted_at, memberships!inner ( linked_accounts ( id, platform, kind, handle, url, verified ) )"
      )
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };

    // linked_accounts come nested under the membership relation.
    const membership = data.memberships as unknown as {
      linked_accounts?: AccountRow[];
    } | null;

    return {
      ok: true,
      data: {
        membershipId: data.membership_id as string,
        displayName: (data.display_name as string) ?? "Sin nombre",
        username: (data.username as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        avatarUrl: (data.avatar_url as string | null) ?? null,
        birthDate: (data.birth_date as string | null) ?? null,
        nationality: (data.nationality as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        privacyAccepted: Boolean(data.privacy_accepted_at),
        accounts: mapAccounts(membership?.linked_accounts),
      },
    };
  }

  /** The current user's own profile within an org. */
  async getMyProfile(orgId: string, userId: string): Promise<Result<MemberProfile | null>> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };
    return this.getProfile(data.id as string);
  }
}
