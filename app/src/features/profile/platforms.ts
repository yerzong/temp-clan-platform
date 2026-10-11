/** Catalog of linkable platforms for the profile: social networks + game accounts. */

export interface PlatformOption {
  value: string;
  label: string;
  kind: "social" | "game";
  color?: string; // brand-ish accent for selector cards
  /** Build a profile URL from a bare handle, when possible. */
  urlFor?: (handle: string) => string;
}

const h = (s: string) => s.replace(/^@+/, "").trim();

export const SOCIAL_PLATFORMS: PlatformOption[] = [
  { value: "twitch", label: "Twitch", kind: "social", color: "265 60% 55%", urlFor: (x) => `https://twitch.tv/${h(x)}` },
  { value: "youtube", label: "YouTube", kind: "social", color: "0 72% 51%", urlFor: (x) => `https://youtube.com/@${h(x)}` },
  { value: "tiktok", label: "TikTok", kind: "social", color: "0 0% 60%", urlFor: (x) => `https://tiktok.com/@${h(x)}` },
  { value: "twitter", label: "X / Twitter", kind: "social", color: "0 0% 70%", urlFor: (x) => `https://x.com/${h(x)}` },
  { value: "instagram", label: "Instagram", kind: "social", color: "330 70% 55%", urlFor: (x) => `https://instagram.com/${h(x)}` },
  { value: "discord", label: "Discord", kind: "social", color: "235 55% 60%" },
  { value: "kick", label: "Kick", kind: "social", color: "128 60% 45%", urlFor: (x) => `https://kick.com/${h(x)}` },
];

export const GAME_PLATFORMS: PlatformOption[] = [
  { value: "xbox", label: "Xbox (Gamertag)", kind: "game" },
  { value: "riot", label: "Riot ID", kind: "game" },
  { value: "steam", label: "Steam", kind: "game" },
  { value: "psn", label: "PlayStation Network", kind: "game" },
  { value: "epic", label: "Epic Games", kind: "game" },
  { value: "battlenet", label: "Battle.net", kind: "game" },
];

export const ALL_PLATFORMS = [...SOCIAL_PLATFORMS, ...GAME_PLATFORMS];

export function platformLabel(value: string): string {
  return ALL_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export function platformOption(value: string): PlatformOption | undefined {
  return ALL_PLATFORMS.find((p) => p.value === value);
}

/**
 * Resolve the clickable link for an account: prefer a stored URL; otherwise
 * build one from the handle for known social platforms. null if not linkable.
 */
export function accountLink(
  platform: string,
  handle: string,
  url: string | null
): string | null {
  if (url && /^https?:\/\//i.test(url)) return url;
  const opt = platformOption(platform);
  if (opt?.urlFor) return opt.urlFor(handle);
  return null;
}
