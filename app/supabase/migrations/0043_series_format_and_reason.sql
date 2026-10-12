-- =============================================================================
-- Temp Platform — Series format + team size on events, attendance reason.
--
--  * team_events.team_size   : 1v1 / 2v2 / 4v4 / 5v5 … (text, open)
--  * team_events.series_format: Bo1 / Bo3 / Bo5 … (text, open)
--  * event_attendance.reason : optional note when a player can't / might come.
--  * create/update_team_event extended; set_event_attendance takes a reason.
-- =============================================================================

alter table public.team_events
  add column if not exists team_size text,
  add column if not exists series_format text;

alter table public.event_attendance
  add column if not exists reason text;

-- -----------------------------------------------------------------------------
-- RPC: create event (now with team_size + series_format).
-- -----------------------------------------------------------------------------
drop function if exists public.create_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text);
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
  p_team_size text,
  p_series_format text,
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
     duration_min, game_mode, maps, team_size, series_format, notes, created_by)
  values
    (p_team_id, v_org, p_kind, trim(p_title),
     nullif(trim(coalesce(p_opponent, '')), ''), p_opponent_id,
     p_scheduled_at, p_duration_min,
     nullif(trim(coalesce(p_game_mode, '')), ''), p_maps,
     nullif(trim(coalesce(p_team_size, '')), ''),
     nullif(trim(coalesce(p_series_format, '')), ''),
     nullif(trim(coalesce(p_notes, '')), ''), v_actor)
  returning id into v_event_id;

  insert into public.event_attendance (event_id, membership_id)
  select distinct v_event_id, rs.membership_id
  from public.roster_slots rs
  where rs.team_id = p_team_id
    and rs.membership_id is not null;

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

grant execute on function public.create_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: update event (extended).
-- -----------------------------------------------------------------------------
drop function if exists public.update_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text);
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
  p_team_size text,
  p_series_format text,
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
      team_size = nullif(trim(coalesce(p_team_size, '')), ''),
      series_format = nullif(trim(coalesce(p_series_format, '')), ''),
      notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_event_id;
end;
$$;

grant execute on function public.update_team_event(uuid, text, text, text, uuid, timestamptz, integer, text, text[], text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: set attendance (now with an optional reason).
-- -----------------------------------------------------------------------------
drop function if exists public.set_event_attendance(uuid, uuid, text);
create or replace function public.set_event_attendance(
  p_event_id uuid,
  p_membership_id uuid,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_is_self boolean;
begin
  select org_id into v_org from public.team_events where id = p_event_id;
  if v_org is null then
    raise exception 'Event not found';
  end if;
  if p_status is null or p_status not in ('yes', 'no', 'maybe', 'pending') then
    raise exception 'Invalid attendance status';
  end if;

  v_is_self := exists (
    select 1 from public.memberships
    where id = p_membership_id and user_id = auth.uid()
  );
  if not (public.is_org_admin(v_org) or v_is_self) then
    raise exception 'You cannot change this attendance';
  end if;

  insert into public.event_attendance (event_id, membership_id, status, reason, responded_at)
  values (p_event_id, p_membership_id, p_status,
          nullif(trim(coalesce(p_reason, '')), ''), now())
  on conflict (event_id, membership_id)
  do update set status = excluded.status,
                reason = excluded.reason,
                responded_at = now();
end;
$$;

grant execute on function public.set_event_attendance(uuid, uuid, text, text) to authenticated;
