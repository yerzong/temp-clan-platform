-- =============================================================================
-- Temp Platform — Ensure Realtime delivers full rows for notifications.
--
-- REPLICA IDENTITY FULL makes Postgres emit the complete row in the logical
-- replication stream that Realtime consumes. Without it, Realtime can fail to
-- evaluate RLS / deliver the payload for row-level filtered subscriptions,
-- which shows up as "the event never arrives on the client" even though the
-- INSERT happened. Safe and idempotent.
-- =============================================================================

alter table public.notifications replica identity full;
