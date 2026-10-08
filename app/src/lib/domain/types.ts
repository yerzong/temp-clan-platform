/**
 * Domain types for Temp Platform. These describe the shapes the app works with,
 * decoupled from the raw database rows. The service layer maps DB -> domain.
 */

export type MemberRole = "owner" | "admin" | "staff" | "creator" | "player";
export type MembershipStatus = "active" | "invited" | "inactive";
export type Platform = "discord" | "twitch" | "youtube" | "tiktok";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
}

export interface Member {
  membershipId: string;
  role: MemberRole;
  status: MembershipStatus;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
  isPlayer: boolean;
  bio: string | null;
}

/** The current user's context within an organization. */
export interface OrgContext {
  organization: Organization;
  role: MemberRole;
}

/** Result wrapper so callers handle success/error explicitly (no throwing across layers). */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
