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
  /** True when an org-level Discord webhook is set (URL is never exposed). */
  hasDiscordWebhook: boolean;
  /** Whether new convocatorias announce on Discord by default. */
  discordNotifyDefault: boolean;
}

/** A registered rival team at the organization level (shared by all teams). */
export interface Opponent {
  id: string;
  name: string;
  logoUrl: string | null;
}

/** A configurable match-parameter option (a map or a mode). */
export interface GameOption {
  id: string;
  kind: "map" | "mode";
  label: string;
}

export interface Member {
  membershipId: string;
  role: MemberRole;
  /** Permission level derived from role. */
  isAdmin: boolean;
  isOwner: boolean;
  status: MembershipStatus;
  displayName: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  /** Functions (independent, can combine). */
  isStaff: boolean;
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
  platform: string | null;
  maxSlots: number;
  rosterCount: number; // filled slots
  slots: TeamSlot[];
  /** True when a Discord webhook is configured (URL itself is never exposed). */
  hasDiscordWebhook: boolean;
}

/** Kind of scheduled team event. */
export type TeamEventKind = "scrim" | "official" | "practice";

/** A player's response to an event convocatoria. */
export type AttendanceStatus = "yes" | "no" | "maybe" | "pending";

/** One rostered player's attendance for an event. */
export interface EventAttendee {
  membershipId: string;
  displayName: string;
  avatarUrl: string | null;
  status: AttendanceStatus;
  /** Optional note (e.g. why they can't make it). */
  reason: string | null;
}

/** A scheduled scrim / match / practice for a team, with attendance. */
export interface TeamEvent {
  id: string;
  teamId: string;
  kind: TeamEventKind;
  title: string;
  /** Free-text rival (for one-off opponents). */
  opponent: string | null;
  /** Registered rival id (official/frequent opponents), when chosen. */
  opponentId: string | null;
  /** Resolved name of the registered rival (null for free-text or none). */
  opponentName: string | null;
  /** Resolved logo of the registered rival. */
  opponentLogoUrl: string | null;
  /** ISO timestamp. */
  scheduledAt: string;
  durationMin: number | null;
  /** Chosen game mode (from the org catalog), or null. */
  gameMode: string | null;
  /** Chosen maps (map pool for the series). */
  maps: string[];
  /** Team size format, e.g. "4v4". */
  teamSize: string | null;
  /** Series format, e.g. "Bo3". */
  seriesFormat: string | null;
  notes: string | null;
  attendees: EventAttendee[];
}

/** A slot on a team. Exists even when empty; keeps its label. */
export interface TeamSlot {
  slotId: string;
  label: string;
  order: number;
  isCaptain: boolean;
  // Filled slot data (null when empty).
  membershipId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/** A player option for assignment (a member flagged is_player). */
export interface RosterPlayer {
  slotId: string;
  membershipId: string;
  displayName: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  position: string | null;
}

// --- Invitations ------------------------------------------------------------

export type InvitationStatus = "pending" | "accepted" | "revoked";

/** Derived, UI-facing state of an invitation link. */
export type InvitationState =
  | "active"
  | "expired"
  | "exhausted"
  | "revoked"
  | "accepted";

export interface Invitation {
  id: string;
  token: string;
  role: MemberRole;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string | null;
  /** null = unlimited uses. */
  maxUses: number | null;
  useCount: number;
  /** Computed from status, expiry, and remaining uses. */
  state: InvitationState;
}

// --- Member profile + linked accounts ---------------------------------------

export type LinkedAccountKind = "social" | "game";

export interface LinkedAccount {
  id: string;
  platform: string;
  kind: LinkedAccountKind;
  handle: string;
  url: string | null;
  verified: boolean;
}

/** Full profile for the "view/edit profile" and the player detail modal. */
export interface MemberProfile {
  membershipId: string;
  displayName: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  nationality: string | null;
  phone: string | null;
  privacyAccepted: boolean;
  accounts: LinkedAccount[];
}

// --- Live now ---------------------------------------------------------------

/** A member who is streaming live right now, with their channel metadata. */
export interface LiveMemberStream {
  membershipId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Streaming platform (only "twitch" is detected today). */
  platform: Platform;
  /** The member's channel handle/login. */
  channel: string;
  /** Public URL to the live channel. */
  url: string;
  title: string;
  /** Twitch category/game, or "" when unknown. */
  game: string;
  viewerCount: number;
  /** ISO timestamp the stream started. */
  startedAt: string;
  thumbnailUrl: string;
}

// --- Notifications ----------------------------------------------------------

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
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
  /** Assigned creator's membership id (for reassignment + filtering). */
  authorMembershipId: string | null;
  authorName: string | null;
  /** Optional deadline (ISO date), or null. */
  dueDate: string | null;
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
