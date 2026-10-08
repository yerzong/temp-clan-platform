-- =============================================================================
-- Temp Platform — Module 4: Temp League (external teams).
--
-- A league is run BY an organization but its teams are EXTERNAL participants
-- (not org memberships). Scope (layer 1, keep it lean — do not rebuild a full
-- bracket engine):
--   leagues         - a league owned by an org (name, game, format)
--   league_teams    - external teams enrolled in a league (name, contact)
--   matches         - a fixture between two league teams + optional result
-- Standings are derived from match results in the service layer.
--
-- Reminder: 'Automatically expose new tables' is OFF -> grant explicitly.
-- =============================================================================

create type league_status as enum ('draft', 'active', 'completed');
create type match_status as enum ('scheduled', 'reported');

-- -----------------------------------------------------------------------------
-- leagues
-- -----------------------------------------------------------------------------
create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  game        text not null default 'gears-e-day',
  format      text not null default 'versus-4v4',
  status      league_status not null default 'draft',
  created_at  timestamptz not null default now()
);

create index leagues_org_id_idx on public.leagues (org_id);

-- -----------------------------------------------------------------------------
-- league_teams (external participants)
-- -----------------------------------------------------------------------------
create table public.league_teams (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid not null references public.leagues (id) on delete cascade,
  name        text not null,
  contact     text,
  created_at  timestamptz not null default now()
);

create index league_teams_league_id_idx on public.league_teams (league_id);

-- -----------------------------------------------------------------------------
-- matches
-- -----------------------------------------------------------------------------
create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues (id) on delete cascade,
  home_team_id  uuid not null references public.league_teams (id) on delete cascade,
  away_team_id  uuid not null references public.league_teams (id) on delete cascade,
  scheduled_at  timestamptz,
  status        match_status not null default 'scheduled',
  home_score    smallint,
  away_score    smallint,
  created_at    timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create index matches_league_id_idx on public.matches (league_id);

-- =============================================================================
-- RLS + grants (leagues scoped by org; children scoped through their league)
-- =============================================================================
alter table public.leagues      enable row level security;
alter table public.league_teams enable row level security;
alter table public.matches      enable row level security;

grant select, insert, update, delete on public.leagues      to authenticated;
grant select, insert, update, delete on public.league_teams to authenticated;
grant select, insert, update, delete on public.matches      to authenticated;

-- leagues: members read in their org; admins write.
create policy "members read leagues in org"
  on public.leagues for select
  using (public.is_org_member(org_id));

create policy "admins write leagues"
  on public.leagues for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- league_teams: scoped through the league's org.
create policy "members read league_teams"
  on public.league_teams for select
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_teams.league_id and public.is_org_member(l.org_id)
    )
  );

create policy "admins write league_teams"
  on public.league_teams for all
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_teams.league_id and public.is_org_admin(l.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = league_teams.league_id and public.is_org_admin(l.org_id)
    )
  );

-- matches: scoped through the league's org.
create policy "members read matches"
  on public.matches for select
  using (
    exists (
      select 1 from public.leagues l
      where l.id = matches.league_id and public.is_org_member(l.org_id)
    )
  );

create policy "admins write matches"
  on public.matches for all
  using (
    exists (
      select 1 from public.leagues l
      where l.id = matches.league_id and public.is_org_admin(l.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = matches.league_id and public.is_org_admin(l.org_id)
    )
  );
