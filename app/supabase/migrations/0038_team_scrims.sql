-- =============================================================================
-- Temp Platform — Team scrims/events + attendance.
--
-- A team can schedule events (scrim / official match / practice). When an event
-- is created, an attendance row is seeded (status "pending") for every player
-- currently filling a slot on that team. Each player can then confirm their own
-- attendance (yes / no / maybe); admins can set anyone's. Rostered members with
-- a login get an in-app notification when an event is created.
--
-- An optional per-team Discord webhook URL lets the app post the convocatoria to
-- a channel; the posting itself happens server-side (not in SQL).
-- =============================================================================

-- --- teams: optional Discord webhook ----------------------------------------
alter table public.teams
  add column if not exists discord_webhook_url text;

-- --- team_events ------------------------------------------------------------
create table if not exists public.team_events (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams (id) on delete cascade,
  org_id        uuid not null references public.organizations (id) on delete cascade,
  kind          text not null default 'scrim'
                  check (kind in ('scrim', 'official', 'practice')),
  title         text not null,
  opponent      text,
  scheduled_at  timestamptz not null,
  duration_min  integer check (duration_min is null or duration_min > 0),
  notes         text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists team_events_team_id_idx on public.team_events (team_id);
create index if not exists team_events_org_id_idx on public.team_events (org_id);
create index if not exists team_events_scheduled_idx on public.team_events (scheduled_at);

-- --- event_attendance -------------------------------------------------------
create table if not exists public.event_attendance (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.team_events (id) on delete cascade,
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  status         text not null default 'pending'
                   check (status in ('yes', 'no', 'maybe', 'pending')),
  responded_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (event_id, membership_id)
);

create index if not exists event_attendance_event_idx on public.event_attendance (event_id);
create index if not exists event_attendance_membership_idx on public.event_attendance (membership_id);

-- =============================================================================
-- Row-Level Security — members read within their org, writes go through RPCs.
-- =============================================================================
alter table public.team_events      enable row level security;
alter table public.event_attendance enable row level security;

create policy "members read team events in their org"
  on public.team_events for select
  using (public.is_org_member(org_id));

create policy "members read attendance in their org"
  on public.event_attendance for select
  using (
    exists (
      select 1 from public.team_events e
      where e.id = event_attendance.event_id
        and public.is_org_member(e.org_id)
    )
  );

-- -----------------------------------------------------------------------------
-- RPC: create an event and seed attendance for the current roster.
-- -----------------------------------------------------------------------------
create or replace function public.create_team_event(
  p_team_id uuid,
  p_kind text,
  p_title text,
  p_opponent text,
  p_scheduled_at timestamptz,
  p_duration_min integer,
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
    (team_id, org_id, kind, title, opponent, scheduled_at, duration_min, notes, created_by)
  values
    (p_team_id, v_org, p_kind, trim(p_title),
     nullif(trim(coalesce(p_opponent, '')), ''),
     p_scheduled_at, p_duration_min,
     nullif(trim(coalesce(p_notes, '')), ''), v_actor)
  returning id into v_event_id;

  -- Seed a pending attendance row per rostered player (filled slots).
  insert into public.event_attendance (event_id, membership_id)
  select distinct v_event_id, rs.membership_id
  from public.roster_slots rs
  where rs.team_id = p_team_id
    and rs.membership_id is not null;

  -- Notify rostered members with a login (exclude the actor).
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

grant execute on function public.create_team_event(uuid, text, text, text, timestamptz, integer, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: update an event's details (admin only).
-- -----------------------------------------------------------------------------
create or replace function public.update_team_event(
  p_event_id uuid,
  p_kind text,
  p_title text,
  p_opponent text,
  p_scheduled_at timestamptz,
  p_duration_min integer,
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
      scheduled_at = p_scheduled_at,
      duration_min = p_duration_min,
      notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_event_id;
end;
$$;

grant execute on function public.update_team_event(uuid, text, text, text, timestamptz, integer, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: delete an event (admin only).
-- -----------------------------------------------------------------------------
create or replace function public.delete_team_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.team_events
  where id = p_event_id
    and public.is_org_admin(org_id);
end;
$$;

grant execute on function public.delete_team_event(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: set attendance for a player. Allowed for org admins, or the player
-- themselves (the membership behind their login).
-- -----------------------------------------------------------------------------
create or replace function public.set_event_attendance(
  p_event_id uuid,
  p_membership_id uuid,
  p_status text
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

  insert into public.event_attendance (event_id, membership_id, status, responded_at)
  values (p_event_id, p_membership_id, p_status, now())
  on conflict (event_id, membership_id)
  do update set status = excluded.status, responded_at = now();
end;
$$;

grant execute on function public.set_event_attendance(uuid, uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: set (or clear) a team's Discord webhook URL (admin only).
-- -----------------------------------------------------------------------------
create or replace function public.set_team_discord_webhook(
  p_team_id uuid,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.teams
  set discord_webhook_url = nullif(trim(coalesce(p_url, '')), '')
  where id = p_team_id
    and public.is_org_admin(org_id);
end;
$$;

grant execute on function public.set_team_discord_webhook(uuid, text) to authenticated;
