-- =============================================================================
-- Temp Platform — Store Discord identity (display name + username + email).
--
-- Discord gives us (confirmed): custom_claims.global_name ("Yerzon G") as the
-- nice display name, full_name (".yerzong") as the username, and email. We were
-- only keeping full_name as display_name, losing the nice name and email. Now:
--   * display_name  = global_name (nice name), fallback to username/email
--   * username      = full_name (the .handle)
--   * email         = email
-- so the UI can show "Yerzon G" with ".yerzong" underneath and search by any.
-- =============================================================================

alter table public.member_profiles
  add column if not exists username text,
  add column if not exists email text;

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
  v_display text;
  v_username text;
  v_email text;
  v_avatar text;
  already_member boolean := false;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.invitations
  where token = invite_token and status = 'pending'
  limit 1;

  if inv is null then
    raise exception 'Invitation not found or already used';
  end if;
  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'This invitation has expired';
  end if;
  if inv.max_uses is not null and inv.use_count >= inv.max_uses then
    raise exception 'This invitation has no uses left';
  end if;

  select id into new_membership_id
  from public.memberships
  where org_id = inv.org_id and user_id = current_user_id
  limit 1;

  if new_membership_id is not null then
    already_member := true;
  end if;

  if not already_member then
    select
      coalesce(
        u.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        u.email,
        'Member'
      ),
      u.raw_user_meta_data ->> 'full_name',
      u.email,
      u.raw_user_meta_data ->> 'avatar_url'
    into v_display, v_username, v_email, v_avatar
    from auth.users u
    where u.id = current_user_id;

    insert into public.memberships (user_id, org_id, role, status)
    values (current_user_id, inv.org_id, inv.role, 'active')
    returning id into new_membership_id;

    insert into public.member_profiles (membership_id, display_name, username, email, avatar_url)
    values (new_membership_id, v_display, v_username, v_email, v_avatar);

    update public.invitations
    set use_count = use_count + 1,
        accepted_at = coalesce(accepted_at, now()),
        status = case
          when max_uses is not null and use_count + 1 >= max_uses then 'accepted'
          else status
        end
    where id = inv.id;

    insert into public.notifications (org_id, user_id, type, title, body)
    select
      inv.org_id, m.user_id, 'member_joined',
      v_display || ' se unió a la organización', 'Rol: ' || inv.role
    from public.memberships m
    where m.org_id = inv.org_id
      and m.role in ('owner', 'admin')
      and m.user_id is not null
      and m.user_id <> current_user_id;
  end if;

  return inv.org_id;
end;
$$;

grant execute on function public.redeem_invitation(text) to authenticated;

-- Backfill existing linked members with their Discord identity.
update public.member_profiles mp
set
  username = coalesce(mp.username, u.raw_user_meta_data ->> 'full_name'),
  email = coalesce(mp.email, u.email),
  display_name = coalesce(
    u.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
    mp.display_name
  )
from public.memberships m
join auth.users u on u.id = m.user_id
where mp.membership_id = m.id
  and m.user_id is not null;
