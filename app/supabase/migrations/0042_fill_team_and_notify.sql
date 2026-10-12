-- =============================================================================
-- Temp Platform — Fill a team with demo players, suggested catalog, richer
-- event notifications.
--
--  * fill_team_demo(team): creates fully-profiled players (avatars) for the
--    team's EMPTY slots, and backfills a generated avatar/nationality/bio for
--    already-filled players that are missing them (never overwrites real data).
--  * seed_default_game_options(org): loads a suggested Gears-style set of modes
--    and maps so the scheduler selectors aren't empty (owner can edit later).
--  * create_team_event: notify the whole roster (with login) + the org owners +
--    the creator, with a richer title/body (time + rival).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RPC: fill a team's empty slots with demo players + backfill missing avatars.
-- Returns the number of players created.
-- -----------------------------------------------------------------------------
create or replace function public.fill_team_demo(p_team_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_member uuid;
  r record;
  i integer := 0;
  created integer := 0;
  n integer;
  pool jsonb := '[
    {"name":"Yerzon \"Phantom\" G.","user":"phantom","nat":"MX","twitch":"phantom_gg","bio":"IGL y entry fragger. Agresivo en las primeras rotaciones."},
    {"name":"Ana \"Vortex\" R.","user":"vortex","nat":"ES","twitch":"vortexana","bio":"Flex capaz de cubrir cualquier rol. Clutch bajo presión."},
    {"name":"Diego \"Reaper\" M.","user":"reaper","nat":"AR","twitch":"reaperdm","bio":"Especialista a larga distancia. Paciencia de francotirador."},
    {"name":"Luis \"Bolt\" C.","user":"bolt","nat":"CO","twitch":"boltlive","bio":"Soporte y utility. Mantiene al equipo con información constante."},
    {"name":"Sofía \"Nova\" T.","user":"nova","nat":"CL","twitch":"novaplays","bio":"Ancla defensiva. Cierra sitios y sostiene retakes."},
    {"name":"Marco \"Titan\" L.","user":"titan","nat":"MX","twitch":"titanmx","bio":"Tanque de primera línea. Abre espacios para el equipo."},
    {"name":"Camila \"Wisp\" V.","user":"wisp","nat":"PE","twitch":"wispgg","bio":"Recon y flanqueos. Información y picks tempranos."},
    {"name":"Iván \"Rook\" S.","user":"rook","nat":"UY","twitch":"rookplays","bio":"Lurker paciente. Vive de los timings tardíos."}
  ]'::jsonb;
begin
  select org_id into v_org from public.teams where id = p_team_id;
  if v_org is null then
    raise exception 'Team not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can fill a team';
  end if;

  n := jsonb_array_length(pool);

  -- Fill empty slots with brand-new, fully-profiled players.
  for r in
    select id from public.roster_slots
    where team_id = p_team_id and membership_id is null
    order by slot_order
  loop
    insert into public.memberships (user_id, org_id, role, status)
    values (null, v_org, 'staff', 'active')
    returning id into v_member;

    insert into public.member_profiles
      (membership_id, display_name, username, avatar_url, is_player,
       nationality, bio, privacy_accepted_at)
    values
      (v_member,
       pool->(i % n)->>'name',
       pool->(i % n)->>'user',
       'https://api.dicebear.com/9.x/adventurer/png?size=256&seed='
         || (pool->(i % n)->>'user') || (i / n)::text,
       true,
       pool->(i % n)->>'nat',
       pool->(i % n)->>'bio',
       now());

    insert into public.linked_accounts (membership_id, platform, handle, kind, verified)
    values (v_member, 'twitch', pool->(i % n)->>'twitch', 'social', true);

    update public.roster_slots set membership_id = v_member where id = r.id;
    i := i + 1;
    created := created + 1;
  end loop;

  -- Backfill generated avatar / nationality / bio for already-filled players
  -- that are missing them (blanks only — never overwrite real data).
  update public.member_profiles mp
  set avatar_url = coalesce(
        nullif(mp.avatar_url, ''),
        'https://api.dicebear.com/9.x/adventurer/png?size=256&seed='
          || regexp_replace(lower(mp.display_name), '[^a-z0-9]', '', 'g')
      ),
      nationality = coalesce(nullif(mp.nationality, ''), 'MX'),
      bio = coalesce(nullif(mp.bio, ''), 'Jugador del roster titular.')
  where mp.membership_id in (
      select membership_id from public.roster_slots
      where team_id = p_team_id and membership_id is not null
    )
    and (mp.avatar_url is null or mp.avatar_url = '');

  -- Ensure a captain exists.
  if not exists (
    select 1 from public.roster_slots
    where team_id = p_team_id and is_captain and membership_id is not null
  ) then
    update public.roster_slots
    set is_captain = true
    where id = (
      select id from public.roster_slots
      where team_id = p_team_id and membership_id is not null
      order by slot_order limit 1
    );
  end if;

  return created;
end;
$$;

grant execute on function public.fill_team_demo(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: load a suggested set of modes + maps for the org (admin). Idempotent.
-- -----------------------------------------------------------------------------
create or replace function public.seed_default_game_options(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  modes text[] := array['Ejecución', 'Rey de la colina', 'Dominación', 'Guardián', 'Horda'];
  maps text[] := array['Gridlock', 'Canals', 'District', 'Checkout', 'Exhibit', 'Nexus'];
  v text;
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Only an admin or owner can manage the catalog';
  end if;

  foreach v in array modes loop
    insert into public.org_game_options (org_id, kind, label)
    values (p_org_id, 'mode', v)
    on conflict (org_id, kind, lower(label)) do nothing;
  end loop;

  foreach v in array maps loop
    insert into public.org_game_options (org_id, kind, label)
    values (p_org_id, 'map', v)
    on conflict (org_id, kind, lower(label)) do nothing;
  end loop;
end;
$$;

grant execute on function public.seed_default_game_options(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: create event — now notifies the whole roster (with login) + owners +
-- the creator, with a richer title/body.
-- -----------------------------------------------------------------------------
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
  v_rival text;
  v_kind_noun text;
  v_title text;
  v_body text;
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

  -- Rival label: registered rival name, else the free-text rival.
  if p_opponent_id is not null then
    select name into v_rival from public.opponents where id = p_opponent_id;
  end if;
  v_rival := coalesce(v_rival, nullif(trim(coalesce(p_opponent, '')), ''));

  v_kind_noun := case p_kind
    when 'official' then 'Partido'
    when 'practice' then 'Práctica'
    else 'Scrim' end;

  v_title := v_kind_noun || ' · ' || v_team_name;
  v_body := trim(p_title)
    || case when v_rival is not null then ' vs ' || v_rival else '' end
    || ' · ' || to_char(p_scheduled_at, 'DD/MM HH24:MI');

  -- Notify: rostered members with a login, the org owners, and the creator.
  insert into public.notifications (org_id, user_id, type, title, body)
  select distinct v_org, u, 'team_event', v_title, v_body
  from (
    select m.user_id as u
    from public.memberships m
    join public.roster_slots rs on rs.membership_id = m.id
    where rs.team_id = p_team_id and m.user_id is not null
    union
    select m.user_id
    from public.memberships m
    where m.org_id = v_org and m.role = 'owner' and m.user_id is not null
    union
    select v_actor where v_actor is not null
  ) recipients
  where u is not null;

  return v_event_id;
end;
$$;

grant execute on function public.create_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text) to authenticated;
