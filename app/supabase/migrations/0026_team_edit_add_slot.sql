-- =============================================================================
-- Temp Platform — Edit team (name/game/platform) + add a slot.
-- =============================================================================

create or replace function public.update_team_meta(
  p_team_id uuid,
  p_name text,
  p_game text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_admin((select org_id from public.teams where id = p_team_id)) then
    raise exception 'Only an admin or owner can edit the team';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Team name is required';
  end if;

  update public.teams
  set name = trim(p_name),
      game = coalesce(p_game, game),
      platform = nullif(trim(coalesce(p_platform, '')), '')
  where id = p_team_id;
end;
$$;

grant execute on function public.update_team_meta(uuid, text, text, text) to authenticated;

-- Add one empty slot to a team (label defaults to the next "Slot N").
create or replace function public.add_team_slot(p_team_id uuid, p_label text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_slot_id uuid;
  next_order integer;
  final_label text;
begin
  if not public.is_org_admin((select org_id from public.teams where id = p_team_id)) then
    raise exception 'Only an admin or owner can add slots';
  end if;

  select coalesce(max(slot_order), 0) + 1 into next_order
  from public.roster_slots where team_id = p_team_id;

  final_label := nullif(trim(coalesce(p_label, '')), '');
  if final_label is null then
    final_label := 'Slot ' || next_order;
  end if;

  insert into public.roster_slots (team_id, label, slot_order)
  values (p_team_id, final_label, next_order)
  returning id into new_slot_id;

  -- Keep max_slots in sync (never below actual slot count).
  update public.teams
  set max_slots = greatest(max_slots, (select count(*) from public.roster_slots where team_id = p_team_id))
  where id = p_team_id;

  return new_slot_id;
end;
$$;

grant execute on function public.add_team_slot(uuid, text) to authenticated;

-- Delete a slot entirely (removes the position from the team).
create or replace function public.delete_team_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_admin((select t.org_id from public.teams t
                              join public.roster_slots rs on rs.team_id = t.id
                              where rs.id = p_slot_id)) then
    raise exception 'Only an admin or owner can delete slots';
  end if;

  delete from public.roster_slots where id = p_slot_id;
end;
$$;

grant execute on function public.delete_team_slot(uuid) to authenticated;
