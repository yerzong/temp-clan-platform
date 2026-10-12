-- =============================================================================
-- Temp Platform — organization-level Discord webhook.
--
-- The owner connects the org's Discord once; every team announces its events
-- there by default. A team may still set its own webhook (teams.discord_webhook_url,
-- added in 0038) to override and post to a different channel.
--
-- Posting resolution (done server-side): team webhook if set, else org webhook.
-- =============================================================================

alter table public.organizations
  add column if not exists discord_webhook_url text;

-- -----------------------------------------------------------------------------
-- RPC: set (or clear) the org's Discord webhook URL (admins/owner only).
-- -----------------------------------------------------------------------------
create or replace function public.set_org_discord_webhook(
  p_org_id uuid,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can configure Discord';
  end if;
  update public.organizations
  set discord_webhook_url = nullif(trim(coalesce(p_url, '')), '')
  where id = p_org_id;
end;
$$;

grant execute on function public.set_org_discord_webhook(uuid, text) to authenticated;
