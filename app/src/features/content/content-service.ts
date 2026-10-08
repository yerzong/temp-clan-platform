import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentPiece,
  ContentPlatform,
  ContentStatus,
  Result,
} from "@/lib/domain/types";

/**
 * Content service — owns content-piece data access: listing, creating, and
 * advancing status. Single responsibility: the content pipeline. Later layers
 * (Twitch/YouTube ingestion, AI highlights) extend this service.
 */
export class ContentService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** All content pieces in an org, newest first, with author name. */
  async listContent(orgId: string): Promise<Result<ContentPiece[]>> {
    const { data, error } = await this.supabase
      .from("content_pieces")
      .select(
        "id, title, platform, status, url, created_at, memberships ( member_profiles ( display_name ) )"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const pieces: ContentPiece[] = (data ?? []).map((row) => {
      const membership = row.memberships as unknown as {
        member_profiles?: { display_name?: string };
      } | null;
      return {
        id: row.id as string,
        title: row.title as string,
        platform: row.platform as ContentPlatform,
        status: row.status as ContentStatus,
        url: (row.url as string | null) ?? null,
        authorName: membership?.member_profiles?.display_name ?? null,
        createdAt: row.created_at as string,
      };
    });

    return { ok: true, data: pieces };
  }

  /** Create a content piece. */
  async createContent(
    orgId: string,
    input: {
      title: string;
      platform: ContentPlatform;
      url: string | null;
      membershipId: string | null;
    }
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase
      .from("content_pieces")
      .insert({
        org_id: orgId,
        title: input.title,
        platform: input.platform,
        url: input.url,
        membership_id: input.membershipId,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id as string };
  }

  /** Move a content piece to a new status. */
  async setStatus(
    contentId: string,
    status: ContentStatus
  ): Promise<Result<null>> {
    const { error } = await this.supabase
      .from("content_pieces")
      .update({ status })
      .eq("id", contentId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }
}
