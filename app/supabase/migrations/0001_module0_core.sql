-- =============================================================================
-- Temp Platform — Module 0 (Core) initial schema
-- Multi-tenant foundation with Row-Level Security (RLS).
--
-- HOW TO APPLY (you stay in control):
--   Option A: Supabase dashboard > SQL Editor > paste this file > Run.
--   Option B: Supabase CLI > `supabase db push`.
--
-- Every tenant-scoped table carries org_id and is protected by RLS so one
-- organization can never read another organization's data.
-- =============================================================================

-- Supabase manages auth.users. We reference it; we do not create it.

-- -----------------------------------------------------------------------------
-- Enum: member role within an organization
-- -----------------------------------------------------------------------------
create type member_role as enum ('owner', 'admin', 'staff', 'creator', 'player');

create type membership_status as enum ('active', 'invited', 'inactive');

-- -----------------------------------------------------------------------------
-- Table: organizations (tenants)
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  plan        text not null default 'starter',
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Table: memberships (user <-> org <-> role) — the heart of the model
-- -----------------------------------------------------------------------------
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  role        member_role not null default 'player',
  status      membership_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (user_id, org_id)
);

create index memberships_org_id_idx on public.memberships (org_id);
create index memberships_user_id_idx on public.memberships (user_id);

-- -----------------------------------------------------------------------------
-- Table: member_profiles (the dual/triple identity wedge)
-- -----------------------------------------------------------------------------
create table public.member_profiles (
  membership_id  uuid primary key references public.memberships (id) on delete cascade,
  display_name   text not null,
  avatar_url     text,
  is_creator     boolean not null default false,
  is_player      boolean not null default false,
  bio            text
);

-- -----------------------------------------------------------------------------
-- Table: linked_accounts (platform handles; real API link comes in Module 1)
-- -----------------------------------------------------------------------------
create table public.linked_accounts (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  platform       text not null check (platform in ('discord', 'twitch', 'youtube', 'tiktok')),
  handle         text not null,
  url            text
);

create index linked_accounts_membership_id_idx on public.linked_accounts (membership_id);

-- =============================================================================
-- Row-Level Security
-- =============================================================================
alter table public.organizations   enable row level security;
alter table public.memberships     enable row level security;
alter table public.member_profiles enable row level security;
alter table public.linked_accounts enable row level security;

-- Helper: is the current user an active member of the given org?
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Helper: is the current user an admin/owner of the given org?
create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

-- --- organizations policies -------------------------------------------------
-- A user can see an org only if they are a member of it.
create policy "members can read their orgs"
  on public.organizations for select
  using (public.is_org_member(id));

-- Any authenticated user can create an org (they become the owner via app logic).
create policy "authenticated users can create orgs"
  on public.organizations for insert
  to authenticated
  with check (true);

-- Only admins/owners can update their org.
create policy "admins can update their org"
  on public.organizations for update
  using (public.is_org_admin(id));

-- --- memberships policies ---------------------------------------------------
-- A user can read memberships of orgs they belong to.
create policy "members can read memberships in their orgs"
  on public.memberships for select
  using (public.is_org_member(org_id));

-- A user can insert their OWN first membership (used when creating an org),
-- or an admin can add members to their org.
create policy "self or admin can insert membership"
  on public.memberships for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_org_admin(org_id));

-- Admins manage memberships in their org.
create policy "admins can update memberships"
  on public.memberships for update
  using (public.is_org_admin(org_id));

create policy "admins can delete memberships"
  on public.memberships for delete
  using (public.is_org_admin(org_id));

-- --- member_profiles policies -----------------------------------------------
create policy "members can read profiles in their orgs"
  on public.member_profiles for select
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_profiles.membership_id
        and public.is_org_member(m.org_id)
    )
  );

create policy "self or admin can write profiles"
  on public.member_profiles for all
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_profiles.membership_id
        and (m.user_id = auth.uid() or public.is_org_admin(m.org_id))
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = member_profiles.membership_id
        and (m.user_id = auth.uid() or public.is_org_admin(m.org_id))
    )
  );

-- --- linked_accounts policies -----------------------------------------------
create policy "members can read linked accounts in their orgs"
  on public.linked_accounts for select
  using (
    exists (
      select 1 from public.memberships m
      where m.id = linked_accounts.membership_id
        and public.is_org_member(m.org_id)
    )
  );

create policy "self or admin can write linked accounts"
  on public.linked_accounts for all
  using (
    exists (
      select 1 from public.memberships m
      where m.id = linked_accounts.membership_id
        and (m.user_id = auth.uid() or public.is_org_admin(m.org_id))
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = linked_accounts.membership_id
        and (m.user_id = auth.uid() or public.is_org_admin(m.org_id))
    )
  );
