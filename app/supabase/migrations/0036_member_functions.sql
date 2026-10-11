-- =============================================================================
-- Temp Platform — Member functions (multi) + admin as a permission.
--
-- New model:
--   * Functions are independent booleans on member_profiles:
--       is_player, is_creator (already existed) + is_staff (new).
--     A member can be several at once.
--   * Permission level stays on memberships.role: 'owner'/'admin' = elevated.
--     Non-admin members use role 'staff' as a NEUTRAL value (RLS only ever
--     checks role in ('owner','admin'), so this is safe and unchanged).
--
-- We DO NOT touch the role enum or any RLS policy. Backfill derives the
-- function flags from the old single role so nothing visually regresses.
-- =============================================================================

alter table public.member_profiles
  add column if not exists is_staff boolean not null default false;

-- Backfill is_staff from the old role, and ensure player/creator flags reflect
-- the old role too (so a member whose role was 'player' keeps the player fn).
update public.member_profiles mp
set is_staff = true
from public.memberships m
where mp.membership_id = m.id
  and m.role in ('owner', 'admin', 'staff')
  and mp.is_staff = false;

update public.member_profiles mp
set is_player = true
from public.memberships m
where mp.membership_id = m.id
  and m.role = 'player'
  and mp.is_player = false;

update public.member_profiles mp
set is_creator = true
from public.memberships m
where mp.membership_id = m.id
  and m.role = 'creator'
  and mp.is_creator = false;

-- RPC: admin edits a member's functions + admin permission (and basic fields).
-- Only org admins/owners may call it. Cannot change the owner's permission.
create or replace function public.admin_update_member(
  p_membership_id uuid,
  p_display_name text,
  p_is_staff boolean,
  p_is_player boolean,
  p_is_creator boolean,
  p_is_admin boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_role member_role;
begin
  select org_id, role into v_org, v_role
  from public.memberships where id = p_membership_id;

  if v_org is null then
    raise exception 'Member not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can edit members';
  end if;

  -- Permission: never downgrade the owner; otherwise map the admin toggle to
  -- role admin vs the neutral 'staff' value.
  if v_role <> 'owner' then
    update public.memberships
    set role = case when p_is_admin then 'admin'::member_role else 'staff'::member_role end
    where id = p_membership_id;
  end if;

  update public.member_profiles
  set
    display_name = coalesce(nullif(trim(coalesce(p_display_name, '')), ''), display_name),
    is_staff = coalesce(p_is_staff, false),
    is_player = coalesce(p_is_player, false),
    is_creator = coalesce(p_is_creator, false)
  where membership_id = p_membership_id;
end;
$$;

grant execute on function public.admin_update_member(uuid, text, boolean, boolean, boolean, boolean) to authenticated;

-- RPC: admin edits a member's FULL profile (contact + identity fields).
create or replace function public.admin_update_member_profile(
  p_membership_id uuid,
  p_username text,
  p_email text,
  p_birth_date date,
  p_nationality text,
  p_phone text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'Member not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can edit member profiles';
  end if;

  update public.member_profiles
  set
    username = nullif(trim(coalesce(p_username, '')), ''),
    email = nullif(trim(coalesce(p_email, '')), ''),
    birth_date = p_birth_date,
    nationality = nullif(trim(coalesce(p_nationality, '')), ''),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    avatar_url = coalesce(nullif(trim(coalesce(p_avatar_url, '')), ''), avatar_url)
  where membership_id = p_membership_id;
end;
$$;

grant execute on function public.admin_update_member_profile(uuid, text, text, date, text, text, text) to authenticated;

-- Extend add_org_member to accept functions + admin, replacing the old
-- role-based manual add. Non-admin => neutral 'staff' role value.
create or replace function public.add_org_member(
  target_org uuid,
  p_display_name text,
  p_is_staff boolean,
  p_is_player boolean,
  p_is_creator boolean,
  p_is_admin boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_membership_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_org_admin(target_org) then
    raise exception 'Only an admin or owner can add members';
  end if;
  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'Display name is required';
  end if;

  insert into public.memberships (user_id, org_id, role, status)
  values (null, target_org,
          case when p_is_admin then 'admin'::member_role else 'staff'::member_role end,
          'active')
  returning id into new_membership_id;

  insert into public.member_profiles (membership_id, display_name, is_staff, is_player, is_creator)
  values (new_membership_id, trim(p_display_name),
          coalesce(p_is_staff, false), coalesce(p_is_player, false), coalesce(p_is_creator, false));

  return new_membership_id;
end;
$$;

grant execute on function public.add_org_member(uuid, text, boolean, boolean, boolean, boolean) to authenticated;
