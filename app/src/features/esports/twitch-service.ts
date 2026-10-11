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

/**
 * Given Twitch handles, return the set of logins currently live. Twitch allows
 * up to 100 user_login params per request. Returns an empty set when disabled
 * or on error (fail-safe: just no live badges).
 */
export async function getLiveLogins(handles: string[]): Promise<Set<string>> {
  const logins = Array.from(
    new Set(handles.map(toLogin).filter(Boolean))
  ).slice(0, 100);
  if (logins.length === 0) return new Set();

  const token = await getAppToken();
  if (!token || !CLIENT_ID) return new Set();

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
    if (!res.ok) return new Set();
    const json = (await res.json()) as {
      data: { user_login: string; type: string }[];
    };
    return new Set(
      json.data
        .filter((s) => s.type === "live")
        .map((s) => s.user_login.toLowerCase())
    );
  } catch {
    return new Set();
  }
}

/** Convenience: is a single handle live right now? */
export async function isHandleLive(handle: string): Promise<boolean> {
  const live = await getLiveLogins([handle]);
  return live.has(toLogin(handle));
}
