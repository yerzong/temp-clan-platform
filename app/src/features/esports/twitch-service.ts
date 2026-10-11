/**
 * Twitch live-status lookup via the Helix API.
 *
 * Uses a platform-level app token (client credentials). Set TWITCH_CLIENT_ID
 * and TWITCH_CLIENT_SECRET in the environment to enable it. When unset, every
 * lookup returns "not live" so the UI simply shows no live badge — nothing
 * breaks.
 *
 * We only need the handle each member linked in their profile (platform =
 * "twitch"); no per-user OAuth is required to read public live status.
 */

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

interface TokenCache {
  token: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

async function getAppToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }
  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token: string; expires_in: number };
    tokenCache = {
      token: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return tokenCache.token;
  } catch {
    return null;
  }
}

/** Normalize a stored handle to a Twitch login (lowercase, no @, no URL). */
function toLogin(handle: string): string {
  let h = handle.trim().toLowerCase();
  h = h.replace(/^@/, "");
  const m = h.match(/twitch\.tv\/([^/?#]+)/);
  if (m) h = m[1];
  return h;
}

/** Normalize any stored handle to the lowercase Twitch login used as a key. */
export function twitchLogin(handle: string): string {
  return toLogin(handle);
}

/** Live stream metadata for one Twitch channel, as the UI needs it. */
export interface TwitchStream {
  /** Lowercase login (stable key to match against stored handles). */
  login: string;
  /** Channel display name as Twitch returns it. */
  userName: string;
  title: string;
  /** Twitch category/game name (e.g. "Valorant"), "" when unknown. */
  gameName: string;
  viewerCount: number;
  /** ISO timestamp the stream went live. */
  startedAt: string;
  /** Ready-to-use thumbnail URL at the requested size. */
  thumbnailUrl: string;
}

/** Fill Twitch's `{width}`/`{height}` template in a thumbnail URL. */
function sizedThumbnail(template: string, width: number, height: number): string {
  return template
    .replace("{width}", String(width))
    .replace("{height}", String(height));
}

/**
 * Given Twitch handles, return live-stream metadata keyed by lowercase login.
 * Twitch allows up to 100 user_login params per request. Returns an empty map
 * when disabled or on error (fail-safe: the UI simply shows nobody live).
 */
export async function getLiveStreams(
  handles: string[]
): Promise<Map<string, TwitchStream>> {
  const logins = Array.from(
    new Set(handles.map(toLogin).filter(Boolean))
  ).slice(0, 100);
  if (logins.length === 0) return new Map();

  const token = await getAppToken();
  if (!token || !CLIENT_ID) return new Map();

  try {
    const params = new URLSearchParams();
    logins.forEach((l) => params.append("user_login", l));
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?${params.toString()}`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
        // Short cache so we don't hit the API on every render.
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return new Map();
    const json = (await res.json()) as {
      data: {
        user_login: string;
        user_name: string;
        title: string;
        game_name: string;
        viewer_count: number;
        started_at: string;
        thumbnail_url: string;
        type: string;
      }[];
    };
    const streams = new Map<string, TwitchStream>();
    for (const s of json.data) {
      if (s.type !== "live") continue;
      const login = s.user_login.toLowerCase();
      streams.set(login, {
        login,
        userName: s.user_name,
        title: s.title,
        gameName: s.game_name,
        viewerCount: s.viewer_count,
        startedAt: s.started_at,
        thumbnailUrl: sizedThumbnail(s.thumbnail_url, 440, 248),
      });
    }
    return streams;
  } catch {
    return new Map();
  }
}

/**
 * Given Twitch handles, return the set of logins currently live. Thin wrapper
 * over {@link getLiveStreams} kept for existing callers that only need a badge.
 */
export async function getLiveLogins(handles: string[]): Promise<Set<string>> {
  const streams = await getLiveStreams(handles);
  return new Set(streams.keys());
}

/** Convenience: is a single handle live right now? */
export async function isHandleLive(handle: string): Promise<boolean> {
  const live = await getLiveLogins([handle]);
  return live.has(toLogin(handle));
}
