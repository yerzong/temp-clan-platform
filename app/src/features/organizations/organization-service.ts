import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OrgContext,
  Result,
  MemberRole,
  Opponent,
  GameOption,
} from "@/lib/domain/types";

/**
 * Organization service — owns organization-level data access: reading the
 * current user's org context and creating organizations. Single responsibility:
 * organizations, not members (see MemberService for that).
 */
export class OrganizationService {
  constructor(private readonly supabase: SupabaseClient) {}

  /** The current user's org context, or null if they have no active org. */
  async getCurrentOrgContext(
    userId: string
  ): Promise<Result<OrgContext | null>> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select(
        "role, organizations ( id, name, slug, logo_url, plan, discord_webhook_url, discord_notify_default )"
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data || !data.organizations) return { ok: true, data: null };

    // PostgREST may return the joined relation as an object or a single-item
    // array depending on how it infers the relationship. Normalize both.
    type OrgRow = {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      plan: string;
      discord_webhook_url: string | null;
      discord_notify_default: boolean | null;
    };
    const rel = data.organizations as unknown as OrgRow | OrgRow[];
    const org = Array.isArray(rel) ? rel[0] : rel;

    if (!org) return { ok: true, data: null };

    return {
      ok: true,
      data: {
        role: data.role as MemberRole,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logo_url,
          plan: org.plan,
          // Only the boolean is kept; the webhook URL never reaches the client.
          hasDiscordWebhook: org.discord_webhook_url != null,
          discordNotifyDefault: org.discord_notify_default ?? true,
        },
      },
    };
  }

  /** Set or clear the org's Discord webhook URL (admin/owner only). */
  async setDiscordWebhook(
    orgId: string,
    url: string | null
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_org_discord_webhook", {
      p_org_id: orgId,
      p_url: url,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Read the org's Discord webhook URL (server-side use only, e.g. posting). */
  async getDiscordWebhook(orgId: string): Promise<Result<string | null>> {
    const { data, error } = await this.supabase
      .from("organizations")
      .select("discord_webhook_url")
      .eq("id", orgId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data?.discord_webhook_url as string | null) ?? null,
    };
  }

  /** Set the default "announce on Discord" toggle (admin/owner only). */
  async setDiscordNotify(orgId: string, enabled: boolean): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("set_org_discord_notify", {
      p_org_id: orgId,
      p_enabled: enabled,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  // --- Rivals (opponents) ----------------------------------------------------

  /** All registered rivals in the org, A→Z. */
  async listOpponents(orgId: string): Promise<Result<Opponent[]>> {
    const { data, error } = await this.supabase
      .from("opponents")
      .select("id, name, logo_url")
      .eq("org_id", orgId)
      .order("name", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        logoUrl: (r.logo_url as string | null) ?? null,
      })),
    };
  }

  /** Create a rival if missing (by name), else return the existing id. */
  async upsertOpponent(
    orgId: string,
    name: string,
    logoUrl: string | null
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("upsert_opponent", {
      p_org_id: orgId,
      p_name: name,
      p_logo_url: logoUrl,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Rename / re-logo a rival (admin). */
  async updateOpponent(
    id: string,
    name: string,
    logoUrl: string | null
  ): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("update_opponent", {
      p_id: id,
      p_name: name,
      p_logo_url: logoUrl,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Delete a rival (admin). */
  async deleteOpponent(id: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_opponent", { p_id: id });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  // --- Match params catalog (maps / modes) -----------------------------------

  /** All configurable map/mode options for the org. */
  async listGameOptions(orgId: string): Promise<Result<GameOption[]>> {
    const { data, error } = await this.supabase
      .from("org_game_options")
      .select("id, kind, label")
      .eq("org_id", orgId)
      .order("label", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data ?? []).map((r) => ({
        id: r.id as string,
        kind: r.kind as GameOption["kind"],
        label: r.label as string,
      })),
    };
  }

  /** Add a map/mode option (admin). */
  async addGameOption(
    orgId: string,
    kind: "map" | "mode",
    label: string
  ): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("add_game_option", {
      p_org_id: orgId,
      p_kind: kind,
      p_label: label,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Delete a map/mode option (admin). */
  async deleteGameOption(id: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("delete_game_option", {
      p_id: id,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Load a suggested set of maps/modes into the catalog (admin). */
  async seedDefaultGameOptions(orgId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("seed_default_game_options", {
      p_org_id: orgId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }

  /** Create a demo team with 5 fully-profiled players (admin). */
  async seedDemoTeam(orgId: string): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("seed_demo_team", {
      p_org_id: orgId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as string };
  }

  /** Create an org atomically via the DB function; caller becomes owner. */
  async createOrganization(name: string, slug: string): Promise<Result<string>> {
    const { data, error } = await this.supabase.rpc("create_organization", {
      org_name: name,
      org_slug: slug,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "That slug is already taken. Try another." };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as string };
  }

  /**
   * The current user leaves an organization. Notifies owners/admins. The owner
   * cannot leave (enforced by the DB function).
   */
  async leaveOrganization(orgId: string): Promise<Result<null>> {
    const { error } = await this.supabase.rpc("leave_organization", {
      target_org: orgId,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  }
}
