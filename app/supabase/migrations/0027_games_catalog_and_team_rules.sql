-- =============================================================================
-- Temp Platform — Game catalog (with cover art URL) + team rules.
--
-- * games: a small catalog so teams reference a game that carries a cover_url
--   (fed by RAWG or any source). Seeded with the games we support; cover_url is
--   null until provided (UI falls back to a stylized gradient).
-- * Rule: a player (membership) may occupy at most ONE team per GAME in the org.
--   Enforced in assign_slot by checking other teams of the same game.
-- * set_team_slot_count: grow/shrink a team's slot count from "edit team".
-- =============================================================================

create table if not exists public.games (
  slug        text primary key,
  name        text not null,
  cover_url   text,
  updated_at  timestamptz not null default now()
);

grant select on public.games to authenticated;
alter table public.games enable row level security;

drop policy if exists "anyone authed reads games" on public.games;
create policy "anyone authed reads games"
  on public.games for select
  to authenticated
  using (true);

insert into public.games (slug, name) values
  ('gears-e-day', 'Gears of War: E-Day'),
  ('valorant', 'Valorant'),
  ('lol', 'League of Legends'),
  ('cs2', 'Counter-Strike 2'),
  ('fortnite', 'Fortnite'),
  ('other', 'Otro')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Rule: one player per game across the org. Rewrite assign_slot to enforce it.
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
  v_org uuid;
  v_game text;
begin
  select rs.team_id, t.org_id, t.game
  into slot_team, v_org, v_game
  from public.roster_slots rs
  join public.teams t on t.id = rs.team_id
  where rs.id = p_slot_id;

  if slot_team is null then
    raise exception 'Slot not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can assign players';
  end if;

  -- Same team twice.
  if exists (
    select 1 from public.roster_slots
    where team_id = slot_team and membership_id = p_membership_id and id <> p_slot_id
  ) then
    raise exception 'That player is already on this team';
  end if;

  -- One player per GAME across the org: block if already in another team of the
  -- same game in this org.
  if exists (
    select 1
    from public.roster_slots rs2
    join public.teams t2 on t2.id = rs2.team_id
    where rs2.membership_id = p_membership_id
      and t2.org_id = v_org
      and t2.game = v_game
      and rs2.team_id <> slot_team
  ) then
    raise exception 'Ese jugador ya está en otro equipo de este juego';
  end if;

  update public.roster_slots
  set membership_id = p_membership_id
  where id = p_slot_id;
end;
$$;

grant execute on function public.assign_slot(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Grow/shrink team slot count. Growing adds "Slot N"; shrinking removes the
-- highest EMPTY slots only (never deletes a filled slot).
-- -----------------------------------------------------------------------------
create or replace function public.set_team_slot_count(p_team_id uuid, p_count integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  current_count integer;
  filled_count integer;
  target integer := greatest(coalesce(p_count, 1), 1);
  n integer;
  del_id uuid;
begin
  select org_id into v_org from public.teams where id = p_team_id;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can resize the team';
  end if;

  select count(*) into current_count from public.roster_slots where team_id = p_team_id;
  select count(*) into filled_count from public.roster_slots
    where team_id = p_team_id and membership_id is not null;

  if target < filled_count then
    raise exception 'No puedes dejar menos slots que jugadores asignados (%).', filled_count;
  end if;

  if target > current_count then
    for n in (current_count + 1)..target loop
      insert into public.roster_slots (team_id, label, slot_order)
      values (p_team_id, 'Slot ' || n, n);
    end loop;
  elsif target < current_count then
    -- Remove highest-order EMPTY slots until we hit target.
    for del_id in
      select id from public.roster_slots
      where team_id = p_team_id and membership_id is null
      order by slot_order desc
      limit (current_count - target)
    loop
      delete from public.roster_slots where id = del_id;
    end loop;
  end if;

  update public.teams set max_slots = target where id = p_team_id;
end;
$$;

grant execute on function public.set_team_slot_count(uuid, integer) to authenticated;
