-- =============================================================================
-- Temp Platform — Rivals registry, match params catalog, org settings, demo team.
--
--  * opponents: org-level registry of rival teams (name + optional logo), shared
--    by every team. The scheduler combobox selects one or creates on the fly.
--  * org_game_options: owner-configurable catalog of maps and modes. Future-proof
--    for when Gears E-Day ships custom games — the owner fills the real values,
--    no code change.
--  * team_events gains opponent_id (registered rival), game_mode, maps[].
--  * organizations.discord_notify_default: default "announce on Discord" toggle.
--  * seed_demo_team: one-click demo team with 5 fully-profiled players.
-- =============================================================================

-- --- org settings -----------------------------------------------------------
alter table public.organizations
  add column if not exists discord_notify_default boolean not null default true;

-- --- opponents (rivals) -----------------------------------------------------
create table if not exists public.opponents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  logo_url    text,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists opponents_org_name_uniq
  on public.opponents (org_id, lower(name));
create index if not exists opponents_org_idx on public.opponents (org_id);

-- --- game options catalog (maps / modes) ------------------------------------
create table if not exists public.org_game_options (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  kind        text not null check (kind in ('map', 'mode')),
  label       text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create unique index if not exists org_game_options_uniq
  on public.org_game_options (org_id, kind, lower(label));
create index if not exists org_game_options_org_idx
  on public.org_game_options (org_id, kind);

-- --- team_events: registered rival + match params ---------------------------
alter table public.team_events
  add column if not exists opponent_id uuid references public.opponents (id) on delete set null,
  add column if not exists game_mode text,
  add column if not exists maps text[];

-- =============================================================================
-- Row-Level Security — members read; writes via RPCs.
-- =============================================================================
alter table public.opponents        enable row level security;
alter table public.org_game_options enable row level security;

create policy "members read opponents in their org"
  on public.opponents for select
  using (public.is_org_member(org_id));

create policy "members read game options in their org"
  on public.org_game_options for select
  using (public.is_org_member(org_id));

grant select on public.opponents        to authenticated;
grant select on public.org_game_options to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: create a rival if it doesn't exist (by name, case-insensitive), else
-- return the existing one (updating its logo when a new one is given).
-- -----------------------------------------------------------------------------
create or replace function public.upsert_opponent(
  p_org_id uuid,
  p_name text,
  p_logo_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can manage rivals';
  end if;
  if v_name = '' then
    raise exception 'The rival needs a name';
  end if;

  select id into v_id
  from public.opponents
  where org_id = p_org_id and lower(name) = lower(v_name);

  if v_id is null then
    insert into public.opponents (org_id, name, logo_url, created_by)
    values (p_org_id, v_name, nullif(trim(coalesce(p_logo_url, '')), ''), auth.uid())
    returning id into v_id;
  elsif nullif(trim(coalesce(p_logo_url, '')), '') is not null then
    update public.opponents set logo_url = trim(p_logo_url) where id = v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_opponent(uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: update / delete a rival (admin).
-- -----------------------------------------------------------------------------
create or replace function public.update_opponent(
  p_id uuid,
  p_name text,
  p_logo_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.opponents
  set name = trim(p_name),
      logo_url = nullif(trim(coalesce(p_logo_url, '')), '')
  where id = p_id
    and public.is_org_admin(org_id)
    and coalesce(trim(p_name), '') <> '';
end;
$$;

grant execute on function public.update_opponent(uuid, text, text) to authenticated;

create or replace function public.delete_opponent(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.opponents
  where id = p_id and public.is_org_admin(org_id);
end;
$$;

grant execute on function public.delete_opponent(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: add / delete a catalog option (map or mode) (admin).
-- -----------------------------------------------------------------------------
create or replace function public.add_game_option(
  p_org_id uuid,
  p_kind text,
  p_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_label text := trim(coalesce(p_label, ''));
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can manage the catalog';
  end if;
  if p_kind not in ('map', 'mode') then
    raise exception 'Invalid option kind';
  end if;
  if v_label = '' then
    raise exception 'The option needs a label';
  end if;

  insert into public.org_game_options (org_id, kind, label)
  values (p_org_id, p_kind, v_label)
  on conflict (org_id, kind, lower(label)) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.org_game_options
    where org_id = p_org_id and kind = p_kind and lower(label) = lower(v_label);
  end if;
  return v_id;
end;
$$;

grant execute on function public.add_game_option(uuid, text, text) to authenticated;

create or replace function public.delete_game_option(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.org_game_options
  where id = p_id and public.is_org_admin(org_id);
end;
$$;

grant execute on function public.delete_game_option(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: set the org's default "announce on Discord" toggle (admin).
-- -----------------------------------------------------------------------------
create or replace function public.set_org_discord_notify(
  p_org_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can change settings';
  end if;
  update public.organizations
  set discord_notify_default = coalesce(p_enabled, true)
  where id = p_org_id;
end;
$$;

grant execute on function public.set_org_discord_notify(uuid, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: create an event (extended with registered rival + match params).
-- -----------------------------------------------------------------------------
drop function if exists public.create_team_event(uuid, text, text, text, timestamptz, integer, text);
create or replace function public.create_team_event(
  p_team_id uuid,
  p_kind text,
  p_title text,
  p_opponent text,
  p_opponent_id uuid,
  p_scheduled_at timestamptz,
  p_duration_min integer,
  p_game_mode text,
  p_maps text[],
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_event_id uuid;
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_team_name text;
  v_title text;
begin
  select org_id, name into v_org, v_team_name
  from public.teams where id = p_team_id;
  if v_org is null then
    raise exception 'Team not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can schedule events';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'The event needs a title';
  end if;
  if p_kind is null or p_kind not in ('scrim', 'official', 'practice') then
    raise exception 'Invalid event kind';
  end if;

  insert into public.team_events
    (team_id, org_id, kind, title, opponent, opponent_id, scheduled_at,
     duration_min, game_mode, maps, notes, created_by)
  values
    (p_team_id, v_org, p_kind, trim(p_title),
     nullif(trim(coalesce(p_opponent, '')), ''), p_opponent_id,
     p_scheduled_at, p_duration_min,
     nullif(trim(coalesce(p_game_mode, '')), ''), p_maps,
     nullif(trim(coalesce(p_notes, '')), ''), v_actor)
  returning id into v_event_id;

  insert into public.event_attendance (event_id, membership_id)
  select distinct v_event_id, rs.membership_id
  from public.roster_slots rs
  where rs.team_id = p_team_id
    and rs.membership_id is not null;

  select mp.display_name into v_actor_name
  from public.memberships m
  join public.member_profiles mp on mp.membership_id = m.id
  where m.org_id = v_org and m.user_id = v_actor
  limit 1;
  v_actor_name := coalesce(v_actor_name, 'Alguien');
  v_title := v_actor_name || ' agendó ' ||
    case p_kind when 'official' then 'un partido'
                when 'practice' then 'una práctica'
                else 'un scrim' end ||
    ' para "' || v_team_name || '"';

  insert into public.notifications (org_id, user_id, type, title, body)
  select distinct v_org, m.user_id, 'team_event', v_title, trim(p_title)
  from public.memberships m
  join public.roster_slots rs on rs.membership_id = m.id
  where rs.team_id = p_team_id
    and m.user_id is not null
    and m.user_id is distinct from v_actor;

  return v_event_id;
end;
$$;

grant execute on function public.create_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: update an event (extended).
-- -----------------------------------------------------------------------------
drop function if exists public.update_team_event(uuid, text, text, text, timestamptz, integer, text);
create or replace function public.update_team_event(
  p_event_id uuid,
  p_kind text,
  p_title text,
  p_opponent text,
  p_opponent_id uuid,
  p_scheduled_at timestamptz,
  p_duration_min integer,
  p_game_mode text,
  p_maps text[],
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.team_events where id = p_event_id;
  if v_org is null then
    raise exception 'Event not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can edit events';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'The event needs a title';
  end if;
  if p_kind is null or p_kind not in ('scrim', 'official', 'practice') then
    raise exception 'Invalid event kind';
  end if;

  update public.team_events
  set kind = p_kind,
      title = trim(p_title),
      opponent = nullif(trim(coalesce(p_opponent, '')), ''),
      opponent_id = p_opponent_id,
      scheduled_at = p_scheduled_at,
      duration_min = p_duration_min,
      game_mode = nullif(trim(coalesce(p_game_mode, '')), ''),
      maps = p_maps,
      notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_event_id;
end;
$$;

grant execute on function public.update_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: seed a demo team with 5 fully-profiled players (admin). Idempotent-ish:
-- it always creates a fresh team named with a suffix so it can be run again.
-- Avatars are generated (DiceBear, PNG) — no real-person photos.
-- -----------------------------------------------------------------------------
create or replace function public.seed_demo_team(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team uuid;
  v_member uuid;
  v_slot uuid;
  r record;
  i integer := 0;
  players jsonb := '[
    {"name":"Yerzon \"Phantom\" G.","user":"phantom","nat":"MX","pos":"Entry","twitch":"phantom_gg","bio":"IGL y entry fragger. Agresivo en las primeras rotaciones."},
    {"name":"Ana \"Vortex\" R.","user":"vortex","nat":"ES","pos":"Flex","twitch":"vortexana","bio":"Flex capaz de cubrir cualquier rol. Clutch bajo presión."},
    {"name":"Diego \"Reaper\" M.","user":"reaper","nat":"AR","pos":"Sniper","twitch":"reaperdm","bio":"Especialista a larga distancia. Paciencia de francotirador."},
    {"name":"Luis \"Bolt\" C.","user":"bolt","nat":"CO","pos":"Support","twitch":"boltlive","bio":"Soporte y utility. Mantiene al equipo con información constante."},
    {"name":"Sofía \"Nova\" T.","user":"nova","nat":"CL","pos":"Anchor","twitch":"novaplays","bio":"Ancla defensiva. Cierra sitios y sostiene retakes."}
  ]'::jsonb;
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can seed a demo team';
  end if;

  insert into public.teams (org_id, name, game, platform, max_slots)
  values (p_org_id, 'Escuadrón Demo', 'gears-e-day', 'Xbox', 5)
  returning id into v_team;

  for r in select * from jsonb_array_elements(players) loop
    i := i + 1;

    insert into public.memberships (user_id, org_id, role, status)
    values (null, p_org_id, 'staff', 'active')
    returning id into v_member;

    insert into public.member_profiles
      (membership_id, display_name, username, avatar_url, is_player, nationality, bio, privacy_accepted_at)
    values
      (v_member,
       r.value->>'name',
       r.value->>'user',
       'https://api.dicebear.com/9.x/adventurer/png?size=256&seed=' || (r.value->>'user'),
       true,
       r.value->>'nat',
       r.value->>'bio',
       now());

    insert into public.linked_accounts (membership_id, platform, handle, kind, verified)
    values (v_member, 'twitch', r.value->>'twitch', 'social', true);

    insert into public.roster_slots (team_id, label, slot_order, membership_id, is_captain)
    values (v_team, r.value->>'pos', i, v_member, i = 1);
  end loop;

  return v_team;
end;
$$;

grant execute on function public.seed_demo_team(uuid) to authenticated;
