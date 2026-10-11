-- =============================================================================
-- Temp Platform — Remove diagnostic helpers used while debugging realtime.
--
-- Drops the temporary diag_realtime() function and revokes the test-only
-- write grants on notifications from service_role (notifications are written
-- only by the redeem_invitation / broadcast path, never by a client/service
-- insert). Keeps SELECT for service_role for server-side reads.
-- =============================================================================

drop function if exists public.diag_realtime();

revoke insert, update, delete on public.notifications from service_role;
