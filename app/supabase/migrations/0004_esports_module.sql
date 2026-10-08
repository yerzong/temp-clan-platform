-- =============================================================================
-- Temp Platform — Module 3: Esports (teams + roster + sustainability)
--
-- Teams belong to an organization. Players (memberships) are assigned to teams
-- via roster slots. The sustainability layer records lightweight, self-reported
-- wellbeing check-ins per player. These are NOT medical data or diagnoses —
-- they are self-reported signals the org uses to care for players humanely.
-- All tables are tenant-scoped (org_id) and protected by RLS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: teams
-- -----------------------------------------------------------------------------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  game        text not null default 'gears-e-day',
  format      text not null default 'versus-4v4', -- e.g. versus-4v4, horde-siege
  created_at  timestamptz not null default now()
);

create index teams_org_id_idx on public.teams (org_id);

-- -----------------------------------------------------------------------------
-- Table: roster_slots (a membership assigned to a team)
-- -----------------------------------------------------------------------------
create table public.roster_slots (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams (id) on delete cascade,
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  position       text, -- optional role/position label
  created_at     timestamptz not null default now(),
  unique (team_id, membership_id)
);

create index roster_slots_team_id_idx on public.roster_slots (team_id);
create index roster_slots_membership_id_idx on public.roster_slots (membership_id);

-- -----------------------------------------------------------------------------
-- Table: wellbeing_checkins (sustainability layer — the differentiator)
-- Self-reported, 1-5 scales. Not medical data.
-- -----------------------------------------------------------------------------
create table public.wellbeing_checkins (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  org_id         uuid not null references public.organizations (id) on delete cascade,
  checkin_date   date not null default current_date,
  mood           smallint not null check (mood between 1 and 5),
  rest           smallint not null check (rest between 1 and 5),
  practice_hours numeric(4,1) not null default 0 check (practice_hours >= 0 and practice_hours <= 24),
  note           text,
  created_at     timestamptz not null default now()
);

create index wellbeing_org_id_idx on public.wellbeing_checkins (org_id);
create index wellbeing_membership_idx on public.wellbeing_checkins (membership_id);

-- =============================================================================
-- Row-Level Security
-- =============================================================================
alter table public.teams              enable row level security;
alter table public.roster_slots       enable row level security;
alter table public.wellbeing_checkins enable row level security;

-- --- teams: members read, admins write -------------------------------------
create policy "members read teams in their org"
  on public.teams for select
  using (public.is_org_member(org_id));

create policy "admins insert teams"
  on public.teams for insert
  to authenticated
  with check (public.is_org_admin(org_id));

create policy "admins update teams"
  on public.teams for update
  using (public.is_org_admin(org_id));

create policy "admins delete teams"
  on public.teams for delete
  using (public.is_org_admin(org_id));

-- --- roster_slots: scoped through the team's org ----------------------------
create policy "members read roster in their org"
  on public.roster_slots for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = roster_slots.team_id
        and public.is_org_member(t.org_id)
    )
  );

create policy "admins write roster"
  on public.roster_slots for all
  using (
    exists (
      select 1 from public.teams t
      where t.id = roster_slots.team_id
        and public.is_org_admin(t.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = roster_slots.team_id
        and public.is_org_admin(t.org_id)
    )
  );

-- --- wellbeing_checkins: sensitive. Admins/owners of the org can read/write.
-- (A finer-grained "player sees only their own" policy can come later when
--  players have real logins; today members are manual roster entries.)
create policy "admins read wellbeing in their org"
  on public.wellbeing_checkins for select
  using (public.is_org_admin(org_id));

create policy "admins write wellbeing in their org"
  on public.wellbeing_checkins for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
