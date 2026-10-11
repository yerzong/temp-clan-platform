-- =============================================================================
-- Temp Platform — Teams v2: predefined named slots, game/platform, captain.
--
-- New model (Opción A):
--   * A team has a game, optional platform, and a fixed number of slots.
--   * Slots EXIST empty with a label (default "Slot N"), renameable (Mid, JG,
--     Sup, Coach...). A slot is filled by assigning a membership; removing the
--     player leaves the slot empty but keeps its label.
--   * One slot per team can be marked as captain.
--
-- Backfill: existing teams get max_slots = their current roster count (min 1);
-- existing roster_slots get a label ("Slot N") and slot_order.
-- =============================================================================

-- --- teams: platform + max_slots -------------------------------------------
alter table public.teams
  add column if not exists platform text,
  add column if not exists max_slots integer not null default 5;

-- --- roster_slots: empty-able, labeled, ordered, captain --------------------
alter table public.roster_slots
  alter column membership_id drop not null;

alter table public.roster_slots
  add column if not exists label text,
  add column if not exists slot_order integer not null default 0,
  add column if not exists is_captain boolean not null default false;

-- The old UNIQUE(team_id, membership_id) is fine (NULLs are distinct), but we
-- also want: a membership can occupy at most one slot per team, and a slot can
-- only be captain if filled. Enforce the "one captain per team" rule with a
-- partial unique index.
drop index if exists roster_one_captain_per_team;
create unique index roster_one_captain_per_team
  on public.roster_slots (team_id)
  where is_captain = true;

-- Backfill labels/order for existing slots.
with ordered as (
  select id, row_number() over (partition by team_id order by created_at) as rn
  from public.roster_slots
  where label is null
)
update public.roster_slots rs
set label = 'Slot ' || o.rn,
    slot_order = o.rn
from ordered o
where rs.id = o.id;

-- Backfill max_slots for existing teams (at least their current roster size).
update public.teams t
set max_slots = greatest(
  t.max_slots,
  coalesce((select count(*) from public.roster_slots rs where rs.team_id = t.id), 0),
  1
);

-- -----------------------------------------------------------------------------
-- RPC: create a team with N empty named slots.
-- -----------------------------------------------------------------------------
create or replace function public.create_team_with_slots(
  target_org uuid,
  p_name text,
  p_game text,
  p_platform text,
  p_slot_count integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team_id uuid;
  n integer;
  slots integer := greatest(coalesce(p_slot_count, 5), 1);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_org_admin(target_org) then
    raise exception 'Only an admin or owner can create teams';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Team name is required';
  end if;

  insert into public.teams (org_id, name, game, platform, max_slots)
  values (target_org, trim(p_name), coalesce(p_game, 'gears-e-day'),
          nullif(trim(coalesce(p_platform, '')), ''), slots)
  returning id into new_team_id;

  for n in 1..slots loop
    insert into public.roster_slots (team_id, label, slot_order)
    values (new_team_id, 'Slot ' || n, n);
  end loop;

  return new_team_id;
end;
$$;

grant execute on function public.create_team_with_slots(uuid, text, text, text, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: assign a membership to a specific (empty) slot.
-- -----------------------------------------------------------------------------
create or replace function public.assign_slot(
  p_slot_id uuid,
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_team uuid;
begin
  select team_id into slot_team from public.roster_slots where id = p_slot_id;
  if slot_team is null then
    raise exception 'Slot not found';
  end if;
  if not public.is_org_admin((select org_id from public.teams where id = slot_team)) then
    raise exception 'Only an admin or owner can assign players';
  end if;
  -- Prevent the same membership from occupying two slots on the same team.
  if exists (
    select 1 from public.roster_slots
    where team_id = slot_team and membership_id = p_membership_id and id <> p_slot_id
  ) then
    raise exception 'That player is already on this team';
  end if;

  update public.roster_slots
  set membership_id = p_membership_id
  where id = p_slot_id;
end;
$$;

grant execute on function public.assign_slot(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: clear a slot (player leaves; slot stays, keeps its label).
-- -----------------------------------------------------------------------------
create or replace function public.clear_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.roster_slots
  set membership_id = null, is_captain = false
  where id = p_slot_id
    and public.is_org_admin((select t.org_id from public.teams t where t.id = roster_slots.team_id));
end;
$$;

grant execute on function public.clear_slot(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: rename a slot's label.
-- -----------------------------------------------------------------------------
create or replace function public.rename_slot(p_slot_id uuid, p_label text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.roster_slots
  set label = nullif(trim(coalesce(p_label, '')), '')
  where id = p_slot_id
    and public.is_org_admin((select t.org_id from public.teams t where t.id = roster_slots.team_id));
end;
$$;

grant execute on function public.rename_slot(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: set the team captain (only a filled slot can be captain).
-- -----------------------------------------------------------------------------
create or replace function public.set_captain(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_team uuid;
  slot_member uuid;
begin
  select team_id, membership_id into slot_team, slot_member
  from public.roster_slots where id = p_slot_id;

  if slot_team is null then
    raise exception 'Slot not found';
  end if;
  if not public.is_org_admin((select org_id from public.teams where id = slot_team)) then
    raise exception 'Only an admin or owner can set the captain';
  end if;
  if slot_member is null then
    raise exception 'An empty slot cannot be captain';
  end if;

  -- Clear any current captain on the team, then set this one.
  update public.roster_slots set is_captain = false where team_id = slot_team;
  update public.roster_slots set is_captain = true where id = p_slot_id;
end;
$$;

grant execute on function public.set_captain(uuid) to authenticated;
