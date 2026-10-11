-- =============================================================================
-- Temp Platform — Complete grants on notifications.
--
-- 'Automatically expose new tables' is OFF, so only the grants we write exist.
-- 0009 granted select/update to `authenticated` but not to service_role or
-- postgres. Realtime's replication reader and server-side tooling need read
-- access too; add the missing grants. RLS still scopes what `authenticated`
-- clients receive.
-- =============================================================================

grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.notifications to postgres;
