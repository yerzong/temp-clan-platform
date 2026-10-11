-- =============================================================================
-- Temp Platform — Strip Discord's legacy "#0" discriminator from names.
--
-- Discord's "name" is like ".yerzong#0" (legacy discriminator). We only fall
-- back to it when global_name/full_name are missing, but the "#0" looks ugly.
-- Clean it both in redeem_invitation (going forward) and via a backfill.
-- =============================================================================

-- Backfill: strip a trailing "#digits" from existing display names / usernames.
update public.member_profiles
set display_name = regexp_replace(display_name, '#\d+$', '')
where display_name ~ '#\d+$';

update public.member_profiles
set username = regexp_replace(username, '#\d+$', '')
where username is not null and username ~ '#\d+$';

-- Rewrite redeem to clean the discriminator on the fallback name.
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
  slot_still_empty boolean := false;
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
      regexp_replace(
        coalesce(
          u.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
          u.raw_user_meta_data ->> 'full_name',
          u.raw_user_meta_data ->> 'name',
          u.email,
          'Member'
        ),
        '#\d+$', ''
      ),
      regexp_replace(coalesce(u.raw_user_meta_data ->> 'full_name', ''), '#\d+$', ''),
      u.email,
      u.raw_user_meta_data ->> 'avatar_url'
    into v_display, v_username, v_email, v_avatar
    from auth.users u
    where u.id = current_user_id;

    insert into public.memberships (user_id, org_id, role, status)
    values (current_user_id, inv.org_id, inv.role, 'active')
    returning id into new_membership_id;

    insert into public.member_profiles (membership_id, display_name, username, email, avatar_url, is_player)
    values (new_membership_id, v_display, nullif(v_username, ''), v_email, v_avatar,
            case when inv.role = 'player' or inv.target_slot_id is not null then true else false end);

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
  else
    if inv.target_slot_id is not null then
      update public.member_profiles set is_player = true where membership_id = new_membership_id;
    end if;
  end if;

  if inv.target_slot_id is not null then
    select (membership_id is null) into slot_still_empty
    from public.roster_slots where id = inv.target_slot_id;

    if slot_still_empty then
      update public.roster_slots
      set membership_id = new_membership_id
      where id = inv.target_slot_id
        and membership_id is null
        and not exists (
          select 1 from public.roster_slots rs2
          where rs2.team_id = (select team_id from public.roster_slots where id = inv.target_slot_id)
            and rs2.membership_id = new_membership_id
        );
    end if;
  end if;

  return inv.org_id;
end;
$$;

grant execute on function public.redeem_invitation(text) to authenticated;
