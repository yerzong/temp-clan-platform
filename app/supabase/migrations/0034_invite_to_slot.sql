-- =============================================================================
-- Temp Platform — Invitation that fills a specific team slot.
--
-- An invitation can optionally target a roster slot. When redeemed, besides
-- joining the org, the new member is assigned to that slot (if still empty).
-- These links are single-use by nature (a slot holds one player).
-- =============================================================================

alter table public.invitations
  add column if not exists target_slot_id uuid
  references public.roster_slots (id) on delete set null;

-- Create a slot invitation: role defaults to 'player', single-use, 24h expiry.
create or replace function public.create_slot_invitation(p_slot_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_token text;
begin
  select t.org_id into v_org
  from public.roster_slots rs
  join public.teams t on t.id = rs.team_id
  where rs.id = p_slot_id;

  if v_org is null then
    raise exception 'Slot not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can invite to a slot';
  end if;

  insert into public.invitations (org_id, role, created_by, target_slot_id, max_uses, expires_at)
  values (v_org, 'player', auth.uid(), p_slot_id, 1, now() + interval '24 hours')
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function public.create_slot_invitation(uuid) to authenticated;

-- Rewrite redeem to also fill the target slot when present.
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

    insert into public.member_profiles (membership_id, display_name, username, email, avatar_url, is_player)
    values (new_membership_id, v_display, v_username, v_email, v_avatar,
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
    -- Existing member joining via a slot link: ensure they're a player.
    if inv.target_slot_id is not null then
      update public.member_profiles set is_player = true where membership_id = new_membership_id;
    end if;
  end if;

  -- Fill the target slot if present and still empty, and the player isn't
  -- already on that team.
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
