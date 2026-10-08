-- =============================================================================
-- Temp Platform — Member invitations.
--
-- Flow: an admin/owner creates an invitation (role + unique token). The invitee
-- opens the invite link, signs in with Discord, and a SECURITY DEFINER RPC
-- redeems the token: it creates the invitee's real membership (linked to their
-- auth user) + profile, and marks the invite accepted.
--
-- NOTE: 'Automatically expose new tables' is OFF on this project, so this
-- migration MUST grant privileges on the new table explicitly, or direct reads
-- fail with "permission denied for table".
-- =============================================================================

create type invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  token       text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  role        member_role not null default 'player',
  status      invitation_status not null default 'pending',
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

create index invitations_org_id_idx on public.invitations (org_id);
create index invitations_token_idx on public.invitations (token);

alter table public.invitations enable row level security;

-- Base grants (RLS still scopes rows).
grant select, insert, update, delete on public.invitations to authenticated;

-- Admins/owners manage invitations in their org.
create policy "admins read invitations"
  on public.invitations for select
  using (public.is_org_admin(org_id));

create policy "admins create invitations"
  on public.invitations for insert
  to authenticated
  with check (public.is_org_admin(org_id));

create policy "admins update invitations"
  on public.invitations for update
  using (public.is_org_admin(org_id));

-- -----------------------------------------------------------------------------
-- RPC: redeem an invitation for the current user.
-- SECURITY DEFINER so it can read the invite and write membership/profile
-- regardless of RLS, but it always binds the new membership to auth.uid().
-- -----------------------------------------------------------------------------
create or replace function public.redeem_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  inv record;
  new_membership_id uuid;
  display text;
  avatar text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.invitations
  where token = invite_token
    and status = 'pending'
  limit 1;

  if inv is null then
    raise exception 'Invitation not found or already used';
  end if;

  -- Already a member of this org? Just mark accepted and return existing.
  select id into new_membership_id
  from public.memberships
  where org_id = inv.org_id and user_id = current_user_id
  limit 1;

  if new_membership_id is null then
    select
      coalesce(
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        u.email,
        'Member'
      ),
      u.raw_user_meta_data ->> 'avatar_url'
    into display, avatar
    from auth.users u
    where u.id = current_user_id;

    insert into public.memberships (user_id, org_id, role, status)
    values (current_user_id, inv.org_id, inv.role, 'active')
    returning id into new_membership_id;

    insert into public.member_profiles (membership_id, display_name, avatar_url)
    values (new_membership_id, display, avatar);
  end if;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return inv.org_id;
end;
$$;

grant execute on function public.redeem_invitation(text) to authenticated;
