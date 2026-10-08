-- =============================================================================
-- Temp Platform — RPC to create an organization atomically.
--
-- Why: creating an org requires three writes (org + owner membership + profile).
-- Doing it from the client hits a chicken-and-egg RLS problem: you cannot SELECT
-- the new org back until you are a member, and you are not a member until the
-- membership row exists. This SECURITY DEFINER function does all three steps as
-- one transaction, but still pins the owner to the CURRENT authenticated user
-- (auth.uid()), so it cannot be abused to act as someone else.
-- =============================================================================

create or replace function public.create_organization(
  org_name text,
  org_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_org_id uuid;
  new_membership_id uuid;
  display text;
  avatar text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Pull display name / avatar from the user's auth metadata.
  select
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      u.email,
      'Owner'
    ),
    u.raw_user_meta_data ->> 'avatar_url'
  into display, avatar
  from auth.users u
  where u.id = current_user_id;

  -- 1. Create the organization.
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  -- 2. Make the current user the Owner.
  insert into public.memberships (user_id, org_id, role, status)
  values (current_user_id, new_org_id, 'owner', 'active')
  returning id into new_membership_id;

  -- 3. Seed the owner's profile.
  insert into public.member_profiles (membership_id, display_name, avatar_url)
  values (new_membership_id, display, avatar);

  return new_org_id;
end;
$$;

-- Allow authenticated users to call it. The function itself enforces that the
-- owner is always the caller.
grant execute on function public.create_organization(text, text) to authenticated;
