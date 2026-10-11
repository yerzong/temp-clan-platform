-- =============================================================================
-- Temp Platform — Rich member profile + flexible linked accounts.
--
-- Profile gains: birth_date, nationality, phone, privacy_accepted_at.
-- (display_name/username/email/avatar_url already exist.)
--
-- linked_accounts: relax the platform check to allow social networks AND game
-- accounts (xbox/riot/steam/psn/...), add a `kind` (social vs game), a
-- `verified` flag (admin-confirmed), and `label` for display. Declarative
-- linking now; real OAuth verification can come later.
-- =============================================================================

alter table public.member_profiles
  add column if not exists birth_date date,
  add column if not exists nationality text,
  add column if not exists phone text,
  add column if not exists privacy_accepted_at timestamptz;

-- Relax linked_accounts.platform (was a strict check for 4 socials).
alter table public.linked_accounts
  drop constraint if exists linked_accounts_platform_check;

alter table public.linked_accounts
  add column if not exists kind text not null default 'social',
  add column if not exists verified boolean not null default false,
  add column if not exists label text;

-- A member can't link the same platform twice.
drop index if exists linked_accounts_unique_platform;
create unique index linked_accounts_unique_platform
  on public.linked_accounts (membership_id, platform);

-- -----------------------------------------------------------------------------
-- RPC: upsert the current user's own profile fields.
-- -----------------------------------------------------------------------------
create or replace function public.update_my_profile(
  p_org uuid,
  p_display_name text,
  p_username text,
  p_birth_date date,
  p_nationality text,
  p_phone text,
  p_avatar_url text,
  p_privacy_accepted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership uuid;
begin
  select id into v_membership
  from public.memberships
  where org_id = p_org and user_id = auth.uid()
  limit 1;

  if v_membership is null then
    raise exception 'You are not a member of this organization';
  end if;

  update public.member_profiles
  set
    display_name = coalesce(nullif(trim(coalesce(p_display_name, '')), ''), display_name),
    username = nullif(trim(coalesce(p_username, '')), ''),
    birth_date = p_birth_date,
    nationality = nullif(trim(coalesce(p_nationality, '')), ''),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    avatar_url = coalesce(nullif(trim(coalesce(p_avatar_url, '')), ''), avatar_url),
    privacy_accepted_at = case
      when p_privacy_accepted and privacy_accepted_at is null then now()
      when p_privacy_accepted then privacy_accepted_at
      else null
    end
  where membership_id = v_membership;
end;
$$;

grant execute on function public.update_my_profile(uuid, text, text, date, text, text, text, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: add/update one of my linked accounts (social or game).
-- -----------------------------------------------------------------------------
create or replace function public.upsert_my_account(
  p_org uuid,
  p_platform text,
  p_kind text,
  p_handle text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership uuid;
begin
  select id into v_membership
  from public.memberships
  where org_id = p_org and user_id = auth.uid()
  limit 1;
  if v_membership is null then
    raise exception 'You are not a member of this organization';
  end if;
  if coalesce(trim(p_platform), '') = '' or coalesce(trim(p_handle), '') = '' then
    raise exception 'Platform and handle are required';
  end if;

  insert into public.linked_accounts (membership_id, platform, kind, handle, url)
  values (v_membership, p_platform, coalesce(p_kind, 'social'), trim(p_handle), nullif(trim(coalesce(p_url, '')), ''))
  on conflict (membership_id, platform)
  do update set handle = excluded.handle, url = excluded.url, kind = excluded.kind, verified = false;
end;
$$;

grant execute on function public.upsert_my_account(uuid, text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: remove one of my linked accounts.
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.linked_accounts la
  using public.memberships m
  where la.id = p_account_id
    and la.membership_id = m.id
    and m.user_id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: an admin verifies/unverifies a member's game account.
-- -----------------------------------------------------------------------------
create or replace function public.set_account_verified(p_account_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.linked_accounts la
  set verified = p_verified
  from public.memberships m
  where la.id = p_account_id
    and la.membership_id = m.id
    and public.is_org_admin(m.org_id);
end;
$$;

grant execute on function public.set_account_verified(uuid, boolean) to authenticated;
