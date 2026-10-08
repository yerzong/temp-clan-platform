-- =============================================================================
-- Temp Platform — Manual (roster) members.
--
-- Why: an org wants to register staff / players / creators as records before
-- (or without) those people logging in. So a membership may have no linked
-- auth user yet. We relax user_id to allow NULL, keep the uniqueness guarantee
-- only for real linked users, and add a SECURITY DEFINER RPC that lets an
-- admin/owner of the org add a member + profile atomically.
-- =============================================================================

-- Allow memberships without a linked auth user (manual roster entries).
alter table public.memberships
  alter column user_id drop not null;

-- The old UNIQUE(user_id, org_id) would collapse all NULL users — but Postgres
-- treats NULLs as distinct in unique indexes, so multiple manual members are
-- fine. We additionally make the intent explicit: uniqueness only matters for
-- real users. (Existing constraint already permits multiple NULLs.)

-- RPC: add a manual member to an org. Only org admins/owners may call it.
create or replace function public.add_org_member(
  target_org uuid,
  p_display_name text,
  p_role member_role,
  p_is_creator boolean,
  p_is_player boolean
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

  -- Manual member: no user_id (not linked to a login yet).
  insert into public.memberships (user_id, org_id, role, status)
  values (null, target_org, p_role, 'active')
  returning id into new_membership_id;

  insert into public.member_profiles (membership_id, display_name, is_creator, is_player)
  values (new_membership_id, trim(p_display_name), coalesce(p_is_creator, false), coalesce(p_is_player, false));

  return new_membership_id;
end;
$$;

grant execute on function public.add_org_member(uuid, text, member_role, boolean, boolean) to authenticated;
