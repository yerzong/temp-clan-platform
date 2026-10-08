-- =============================================================================
-- Temp Platform — Module 1: Content (channels + content pieces).
--
-- Layer 1 (this migration): in-platform content management, no external APIs.
-- - channels: a creator's linked channel (twitch/youtube/tiktok handle/url).
-- - content_pieces: a tracked clip/video with a status pipeline
--   (idea -> editing -> published) and an optional link + the creator who owns it.
--
-- Later layers add Twitch/YouTube API ingestion + AI highlight detection.
--
-- Reminder: 'Automatically expose new tables' is OFF -> grant explicitly.
-- =============================================================================

create type content_status as enum ('idea', 'editing', 'review', 'published');
create type content_platform as enum ('twitch', 'youtube', 'tiktok', 'other');

-- -----------------------------------------------------------------------------
-- Table: channels (a creator membership's channel on a platform)
-- -----------------------------------------------------------------------------
create table public.channels (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  platform       content_platform not null,
  handle         text not null,
  url            text,
  created_at     timestamptz not null default now()
);

create index channels_org_id_idx on public.channels (org_id);
create index channels_membership_id_idx on public.channels (membership_id);

-- -----------------------------------------------------------------------------
-- Table: content_pieces (tracked clips/videos)
-- -----------------------------------------------------------------------------
create table public.content_pieces (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  membership_id  uuid references public.memberships (id) on delete set null,
  title          text not null,
  platform       content_platform not null default 'other',
  status         content_status not null default 'idea',
  url            text,
  created_at     timestamptz not null default now()
);

create index content_pieces_org_id_idx on public.content_pieces (org_id);

-- =============================================================================
-- RLS + grants
-- =============================================================================
alter table public.channels       enable row level security;
alter table public.content_pieces enable row level security;

grant select, insert, update, delete on public.channels       to authenticated;
grant select, insert, update, delete on public.content_pieces to authenticated;

-- channels: members read within their org; admins write.
create policy "members read channels in org"
  on public.channels for select
  using (public.is_org_member(org_id));

create policy "admins write channels"
  on public.channels for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- content_pieces: members read within their org; admins write.
create policy "members read content in org"
  on public.content_pieces for select
  using (public.is_org_member(org_id));

create policy "admins write content"
  on public.content_pieces for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
