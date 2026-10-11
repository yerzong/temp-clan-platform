-- =============================================================================
-- Temp Platform — Deliver notifications via Realtime Broadcast (not
-- postgres_changes).
--
-- Why: postgres_changes with RLS was not delivering INSERT events to an
-- `authenticated` client (channel SUBSCRIBED, token present, server-side test
-- works, but no event reaches the browser). Supabase's recommended, more
-- reliable path is "Broadcast from the database": an AFTER INSERT trigger emits
-- a broadcast to a per-user topic, and the client subscribes to that topic.
-- Delivery no longer depends on the replication stream evaluating RLS.
--
-- Topic convention: 'notif:<user_id>'. Authorization is enforced by an RLS
-- policy on realtime.messages so a user may only listen to their own topic.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Trigger: on new notification, broadcast to the recipient's private topic.
-- -----------------------------------------------------------------------------
create or replace function public.broadcast_notification()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.broadcast_changes(
    'notif:' || new.user_id::text, -- topic
    tg_op,                         -- event op (INSERT)
    tg_op,                         -- operation
    tg_table_name,                 -- table
    tg_table_schema,               -- schema
    new,                           -- new record
    null                           -- old record
  );
  return new;
end;
$$;

drop trigger if exists trg_broadcast_notification on public.notifications;
create trigger trg_broadcast_notification
  after insert on public.notifications
  for each row
  execute function public.broadcast_notification();

-- -----------------------------------------------------------------------------
-- Authorization: a user may only receive broadcasts on their own topic.
-- realtime.messages already has RLS enabled by Supabase (we are not its owner,
-- so we must NOT run ALTER TABLE on it). We only add the SELECT policy that
-- authorizes a user to read their own 'notif:<uid>' topic.
-- -----------------------------------------------------------------------------
drop policy if exists "users read own notification topic" on realtime.messages;
create policy "users read own notification topic"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.topic() = 'notif:' || auth.uid()::text
  );
