-- =============================================================================
-- Temp Platform — Notification panel dismiss vs. log delete.
--
-- Two distinct actions:
--   * DISMISS: hide a notification from the bell panel only; it stays in the
--     full log (bitácora). Backed by a dismissed_at timestamp.
--   * DELETE: remove it for good from the log too.
--
-- The bell panel shows rows where dismissed_at IS NULL. The log page shows all
-- rows. Each function is SECURITY DEFINER and scoped to auth.uid() so a user
-- can only touch their own notifications.
-- =============================================================================

alter table public.notifications
  add column if not exists dismissed_at timestamptz;

create index if not exists notifications_user_active_idx
  on public.notifications (user_id, dismissed_at, created_at desc);

-- Clients need DELETE on their own rows (RLS scopes to the user).
grant delete on public.notifications to authenticated;

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- --- Dismiss (hide from panel) ----------------------------------------------
create or replace function public.dismiss_notification(notif_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set dismissed_at = now()
  where id = notif_id and user_id = auth.uid();
$$;

create or replace function public.dismiss_all_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set dismissed_at = now()
  where user_id = auth.uid() and dismissed_at is null;
$$;

-- --- Delete (remove from log) -----------------------------------------------
create or replace function public.delete_notification(notif_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications
  where id = notif_id and user_id = auth.uid();
$$;

create or replace function public.delete_all_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications where user_id = auth.uid();
$$;

grant execute on function public.dismiss_notification(uuid) to authenticated;
grant execute on function public.dismiss_all_notifications() to authenticated;
grant execute on function public.delete_notification(uuid) to authenticated;
grant execute on function public.delete_all_notifications() to authenticated;
