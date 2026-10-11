-- =============================================================================
-- Temp Platform — Invitations v2 (configurable links) + Notifications.
--
-- What changes and why:
--   * An invitation link is now CONFIGURABLE by the admin who creates it:
--       - role            : the role granted to whoever joins (never admin/owner)
--       - expires_at       : optional expiry; link stops working past this time
--       - max_uses         : NULL = unlimited, N = at most N people can join
--       - use_count        : how many people have redeemed it so far
--     This replaces the old "one token = one person" model so a single link can
--     be shared with, say, 100 staff members.
--   * redeem_invitation now validates expiry + remaining uses, increments the
--     counter, and only flips status to 'accepted' when a single-use link is
--     consumed or a multi-use link runs out. Expiry/exhaustion are derived.
--   * New notifications table so owners/admins get "X joined as <role>" alerts
--     when someone redeems a link.
--
-- EXISTING ROWS: left as single-use, no expiry (max_uses = 1), so the invites
-- already in the DB keep working exactly as before. Nothing is destroyed.
--
-- Reminder: 'Automatically expose new tables' is OFF -> grant explicitly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extend invitations with configurable usage + expiry.
-- -----------------------------------------------------------------------------
alter table public.invitations
  add column if not exists expires_at timestamptz,
  add column if not exists max_uses integer,
  add column if not exists use_count integer not null default 0;

-- Backfill existing rows: treat them as classic single-use links.
update public.invitations
set max_uses = 1
where max_uses is null;

-- An accepted single-use invite has already been used once.
update public.invitations
set use_count = 1
where status = 'accepted' and use_count = 0;

-- Guard: max_uses, when set, must be positive.
alter table public.invitations
  drop constraint if exists invitations_max_uses_positive;
alter table public.invitations
  add constraint invitations_max_uses_positive
  check (max_uses is null or max_uses > 0);

-- -----------------------------------------------------------------------------
-- 2. Notifications table.
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  -- The admin/owner this notification is addressed to.
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null default 'member_joined',
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_org_id_idx
  on public.notifications (org_id);

alter table public.notifications enable row level security;

-- Base grants (RLS still scopes rows). No INSERT for clients: rows are written
-- only by SECURITY DEFINER functions (redeem_invitation).
grant select, update on public.notifications to authenticated;

-- A user can only read their own notifications.
create policy "users read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- A user can only mark their own notifications as read.
create policy "users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. Redeem v2: validate expiry + uses, increment counter, notify admins.
-- -----------------------------------------------------------------------------
create or replace function public.redeem_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  inv record;
  new_membership_id uuid;
  display text;
  avatar text;
  already_member boolean := false;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.invitations
  where token = invite_token
    and status = 'pending'
  limit 1;

  if inv is null then
    raise exception 'Invitation not found or already used';
  end if;

  -- Expiry check.
  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'This invitation has expired';
  end if;

  -- Usage check (max_uses NULL = unlimited).
  if inv.max_uses is not null and inv.use_count >= inv.max_uses then
    raise exception 'This invitation has no uses left';
  end if;

  -- Already a member of this org? Don't create a duplicate membership and
  -- don't consume a use.
  select id into new_membership_id
  from public.memberships
  where org_id = inv.org_id and user_id = current_user_id
  limit 1;

  if new_membership_id is not null then
    already_member := true;
  end if;

  if not already_member then
    select
      coalesce(
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        u.email,
        'Member'
      ),
      u.raw_user_meta_data ->> 'avatar_url'
    into display, avatar
    from auth.users u
    where u.id = current_user_id;

    insert into public.memberships (user_id, org_id, role, status)
    values (current_user_id, inv.org_id, inv.role, 'active')
    returning id into new_membership_id;

    insert into public.member_profiles (membership_id, display_name, avatar_url)
    values (new_membership_id, display, avatar);

    -- Consume one use.
    update public.invitations
    set use_count = use_count + 1,
        accepted_at = coalesce(accepted_at, now()),
        -- Flip to accepted when this was the last available use.
        status = case
          when max_uses is not null and use_count + 1 >= max_uses then 'accepted'
          else status
        end
    where id = inv.id;

    -- Notify every owner/admin of the org (except the joiner themselves).
    insert into public.notifications (org_id, user_id, type, title, body)
    select
      inv.org_id,
      m.user_id,
      'member_joined',
      display || ' se unió a la organización',
      'Rol: ' || inv.role
    from public.memberships m
    where m.org_id = inv.org_id
      and m.role in ('owner', 'admin')
      and m.user_id is not null
      and m.user_id <> current_user_id;
  end if;

  return inv.org_id;
end;
$$;

grant execute on function public.redeem_invitation(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Mark notifications as read (bulk, for the current user).
-- -----------------------------------------------------------------------------
create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
$$;

grant execute on function public.mark_notifications_read() to authenticated;
