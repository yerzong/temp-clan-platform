import type { Result } from "@/lib/domain/types";

/**
 * Minimal server-side Twitch Helix client.
 *
 * Uses an APP access token (client credentials grant) — enough to read a
 * channel's public VODs. No per-user authorization needed. The client secret
 * is read from server env and NEVER sent to the browser.
 *
 * Env required:
 *   TWITCH_CLIENT_ID
 *   TWITCH_CLIENT_SECRET
 */

export interface TwitchVod {
  id: string;
  title: string;
  url: string;
  durationSeconds: number;
  publishedAt: string;
}

export interface TwitchClip {
  id: string;
  title: string;
  url: string;
  viewCount: number;
  durationSeconds: number;
  createdAt: string;
  creatorName: string;
}

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const HELIX = "https://api.twitch.tv/helix";

// Cache the app token in-process until it (roughly) expires.
let cachedToken: { value: string; expiresAt: number } | null = null;

export class TwitchClient {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID ?? "";
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET ?? "";
  }

  /** True when the server has Twitch credentials configured. */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async getAppToken(): Promise<Result<string>> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Twitch is not configured on the server." };
    }
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 60_000) {
      return { ok: true, data: cachedToken.value };
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "client_credentials",
    });

    const res = await fetch(TOKEN_URL, { method: "POST", body });
    if (!res.ok) {
      return { ok: false, error: `Twitch auth failed (${res.status}).` };
    }
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    cachedToken = {
      value: json.access_token,
      expiresAt: now + json.expires_in * 1000,
    };
    return { ok: true, data: json.access_token };
  }

  private async authedFetch(path: string): Promise<Result<unknown>> {
    const token = await this.getAppToken();
    if (!token.ok) return token;

    const res = await fetch(`${HELIX}${path}`, {
      headers: {
        "Client-Id": this.clientId,
        Authorization: `Bearer ${token.data}`,
      },
    });
    if (res.status === 404) return { ok: false, error: "Not found on Twitch." };
    if (!res.ok) {
      return { ok: false, error: `Twitch API error (${res.status}).` };
    }
    return { ok: true, data: await res.json() };
  }

  /** Resolve a channel login (username) to its Twitch user id. */
  private async getUserId(login: string): Promise<Result<string>> {
    const clean = login.trim().replace(/^@/, "").toLowerCase();
    if (!clean) return { ok: false, error: "Empty channel name." };

    const res = await this.authedFetch(
      `/users?login=${encodeURIComponent(clean)}`
    );
    if (!res.ok) return res;

    const data = res.data as { data?: { id: string }[] };
    const user = data.data?.[0];
    if (!user) return { ok: false, error: `Channel "${login}" not found.` };
    return { ok: true, data: user.id };
  }

  /** Get recent archived VODs for a channel by its username. */
  async getChannelVods(
    login: string,
    limit = 10
  ): Promise<Result<TwitchVod[]>> {
    const userId = await this.getUserId(login);
    if (!userId.ok) return userId;

    const res = await this.authedFetch(
      `/videos?user_id=${userId.data}&type=archive&first=${limit}`
    );
    if (!res.ok) return res;

    const data = res.data as {
      data?: {
        id: string;
        title: string;
        url: string;
        duration: string;
        published_at: string;
      }[];
    };

    const vods: TwitchVod[] = (data.data ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      durationSeconds: parseTwitchDuration(v.duration),
      publishedAt: v.published_at,
    }));

    return { ok: true, data: vods };
  }

  /**
   * Get a channel's top clips, ordered by view count. These are the community's
   * own "highlights" — the moments viewers already marked as good — so view
   * count is our highlight signal without processing any video.
   * `days` optionally restricts to recently created clips.
   */
  async getTopClips(
    login: string,
    limit = 20,
    days?: number
  ): Promise<Result<TwitchClip[]>> {
    const userId = await this.getUserId(login);
    if (!userId.ok) return userId;

    let path = `/clips?broadcaster_id=${userId.data}&first=${limit}`;
    if (days && days > 0) {
      const start = new Date();
      start.setDate(start.getDate() - days);
      path += `&started_at=${encodeURIComponent(start.toISOString())}`;
    }

    const res = await this.authedFetch(path);
    if (!res.ok) return res;

    const data = res.data as {
      data?: {
        id: string;
        title: string;
        url: string;
        view_count: number;
        duration: number;
        created_at: string;
        creator_name: string;
      }[];
    };

    const clips: TwitchClip[] = (data.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      viewCount: c.view_count,
      durationSeconds: Math.round(c.duration),
      createdAt: c.created_at,
      creatorName: c.creator_name,
    }));

    // API returns ordered by views, but ensure it.
    clips.sort((a, b) => b.viewCount - a.viewCount);

    return { ok: true, data: clips };
  }
}

/** Twitch durations look like "3h21m0s" / "47m12s" / "32s". Convert to seconds. */
function parseTwitchDuration(d: string): number {
  const m = d.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!m) return 0;
  const [, h, min, s] = m;
  return (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + (Number(s) || 0);
}
