-- =============================================================================
-- Temp Platform — grants for the team scrims/events tables.
--
-- This project grants table privileges to `authenticated` explicitly (default
-- privileges are not relied on). Reads happen through the user's client and are
-- gated by the RLS SELECT policies from 0038. All writes go through the
-- SECURITY DEFINER RPCs (create/update/delete event, set attendance, set
-- webhook), so no INSERT/UPDATE/DELETE grant is given here on purpose — direct
-- writes stay blocked and funnel through the RPCs.
-- =============================================================================

grant select on public.team_events      to authenticated;
grant select on public.event_attendance to authenticated;
