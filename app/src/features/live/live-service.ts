import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveMemberStream, Result } from "@/lib/domain/types";
import { MemberService } from "@/features/members/member-service";
import { EsportsService } from "@/features/esports/esports-service";
import { getLiveStreams, twitchLogin } from "@/features/esports/twitch-service";

/**
 * Live service — resolves which org members are streaming right now by crossing
 * the roster with their linked Twitch handles and the Helix live status.
 *
 * Only Twitch is detectable today (see twitch-service). YouTube/Facebook/X are
 * deferred, so other platforms never appear here even if linked.
 */
export class LiveService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** Members currently live, most viewers first. Empty when nobody is live. */
  async listLive(orgId: string): Promise<Result<LiveMemberStream[]>> {
    const membersRes = await new MemberService(this.supabase).listMembers(orgId);
    if (!membersRes.ok) return membersRes;

    const members = membersRes.data;
    if (members.length === 0) return { ok: true, data: [] };

    const esports = new EsportsService(this.supabase);
    const handlesRes = await esports.getTwitchHandles(
      members.map((m) => m.membershipId)
    );
    if (!handlesRes.ok) return handlesRes;
    if (handlesRes.data.length === 0) return { ok: true, data: [] };

    const streams = await getLiveStreams(
      handlesRes.data.map((h) => h.handle)
    );
    if (streams.size === 0) return { ok: true, data: [] };

    const memberById = new Map(members.map((m) => [m.membershipId, m]));
    const live: LiveMemberStream[] = [];

    for (const { membershipId, handle } of handlesRes.data) {
      const stream = streams.get(twitchLogin(handle));
      const member = memberById.get(membershipId);
      if (!stream || !member) continue;
      live.push({
        membershipId,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
        platform: "twitch",
        channel: stream.userName,
        url: `https://twitch.tv/${stream.login}`,
        title: stream.title,
        game: stream.gameName,
        viewerCount: stream.viewerCount,
        startedAt: stream.startedAt,
        thumbnailUrl: stream.thumbnailUrl,
      });
    }

    live.sort((a, b) => b.viewerCount - a.viewerCount);
    return { ok: true, data: live };
  }
}
