/** Catalog of linkable platforms for the profile: social networks + game accounts. */

export interface PlatformOption {
  value: string;
  label: string;
  kind: "social" | "game";
}

export const SOCIAL_PLATFORMS: PlatformOption[] = [
  { value: "twitch", label: "Twitch", kind: "social" },
  { value: "youtube", label: "YouTube", kind: "social" },
  { value: "tiktok", label: "TikTok", kind: "social" },
  { value: "twitter", label: "X / Twitter", kind: "social" },
  { value: "instagram", label: "Instagram", kind: "social" },
  { value: "discord", label: "Discord", kind: "social" },
  { value: "kick", label: "Kick", kind: "social" },
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
