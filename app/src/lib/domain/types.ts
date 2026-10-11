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
  /**
   * True when this membership is backed by a real auth account (joined via an
   * invitation / Discord login). False for manual roster entries created with
   * "add member" that have no login yet.
   */
  isLinked: boolean;
}

/** The current user's context within an organization. */
export interface OrgContext {
  organization: Organization;
  role: MemberRole;
}

// --- Esports module ---------------------------------------------------------

export interface Team {
  id: string;
  name: string;
  game: string;
  format: string;
  rosterCount: number;
  roster: RosterPlayer[];
}

export interface RosterPlayer {
  slotId: string;
  membershipId: string;
  displayName: string;
  avatarUrl: string | null;
  position: string | null;
}

/**
 * A wellbeing check-in. Self-reported signals (1-5), NOT medical data.
 * Used by the org to care for players — never a diagnosis.
 */
export interface WellbeingCheckin {
  id: string;
  membershipId: string;
  checkinDate: string;
  mood: number; // 1-5
  rest: number; // 1-5
  practiceHours: number;
  note: string | null;
}

/** Burnout signal derived from recent check-ins. A prompt, not a verdict. */
export type BurnoutSignal = "ok" | "watch" | "elevated" | "unknown";

export interface PlayerWellbeing {
  membershipId: string;
  displayName: string;
  avatarUrl: string | null;
  latest: WellbeingCheckin | null;
  signal: BurnoutSignal;
}

// --- Invitations ------------------------------------------------------------

export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface Invitation {
  id: string;
  token: string;
  role: MemberRole;
  status: InvitationStatus;
  createdAt: string;
}

// --- Content module ---------------------------------------------------------

export type ContentPlatform = "twitch" | "youtube" | "tiktok" | "other";
export type ContentStatus = "idea" | "editing" | "review" | "published";

export interface ContentPiece {
  id: string;
  title: string;
  platform: ContentPlatform;
  status: ContentStatus;
  url: string | null;
  authorName: string | null;
  createdAt: string;
}

// --- Temp League module -----------------------------------------------------

export type LeagueStatus = "draft" | "active" | "completed";
export type MatchStatus = "scheduled" | "reported";

export interface League {
  id: string;
  name: string;
  game: string;
  format: string;
  status: LeagueStatus;
  teamCount: number;
}

export interface LeagueTeam {
  id: string;
  name: string;
  contact: string | null;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}

/** A row in the derived standings table. */
export interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number; // 3 per win
}

/** Result wrapper so callers handle success/error explicitly (no throwing across layers). */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
