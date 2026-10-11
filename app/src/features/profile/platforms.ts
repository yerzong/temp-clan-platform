/** Catalog of linkable platforms for the profile: social/streaming + game accounts. */

export interface PlatformOption {
  value: string;
  label: string;
  kind: "social" | "game";
  /** BrandIcon key (falls back to the value, then a generic dot). */
  icon: string;
  color?: string; // "h s% l%" for hsl()
  urlFor?: (handle: string) => string;
}

const h = (s: string) => s.replace(/^@+/, "").trim();

export const SOCIAL_PLATFORMS: PlatformOption[] = [
  { value: "twitch", label: "Twitch", kind: "social", icon: "twitch", color: "264 55% 56%", urlFor: (x) => `https://twitch.tv/${h(x)}` },
  { value: "youtube", label: "YouTube", kind: "social", icon: "youtube", color: "0 72% 51%", urlFor: (x) => `https://youtube.com/@${h(x)}` },
  { value: "kick", label: "Kick", kind: "social", icon: "kick", color: "128 60% 45%", urlFor: (x) => `https://kick.com/${h(x)}` },
  { value: "tiktok", label: "TikTok", kind: "social", icon: "tiktok", color: "0 0% 85%", urlFor: (x) => `https://tiktok.com/@${h(x)}` },
  { value: "instagram", label: "Instagram", kind: "social", icon: "instagram", color: "330 70% 55%", urlFor: (x) => `https://instagram.com/${h(x)}` },
  { value: "twitter", label: "X / Twitter", kind: "social", icon: "x", color: "0 0% 90%", urlFor: (x) => `https://x.com/${h(x)}` },
  { value: "facebook", label: "Facebook", kind: "social", icon: "facebook", color: "214 89% 52%", urlFor: (x) => `https://facebook.com/${h(x)}` },
  { value: "discord", label: "Discord", kind: "social", icon: "discord", color: "235 55% 60%" },
  { value: "snapchat", label: "Snapchat", kind: "social", icon: "snapchat", color: "54 100% 50%", urlFor: (x) => `https://snapchat.com/add/${h(x)}` },
];

export const GAME_PLATFORMS: PlatformOption[] = [
  { value: "xbox", label: "Xbox (Gamertag)", kind: "game", icon: "xbox", color: "120 54% 40%" },
  { value: "riot", label: "Riot ID", kind: "game", icon: "riot", color: "0 72% 51%" },
  { value: "steam", label: "Steam", kind: "game", icon: "steam", color: "210 25% 55%", urlFor: (x) => `https://steamcommunity.com/id/${h(x)}` },
  { value: "psn", label: "PlayStation Network", kind: "game", icon: "psn", color: "214 89% 52%" },
  { value: "epic", label: "Epic Games", kind: "game", icon: "epic", color: "0 0% 85%" },
  { value: "battlenet", label: "Battle.net", kind: "game", icon: "battlenet", color: "205 80% 55%" },
  { value: "activision", label: "Activision ID", kind: "game", icon: "activision", color: "0 0% 70%" },
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
 * build one from the handle for known platforms. null if not linkable.
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
