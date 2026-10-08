-- =============================================================================
-- Temp Platform — Fix "permission denied for table" by granting table access
-- and fixing a potential RLS recursion on memberships.
--
-- Root cause: the project was created with "Automatically expose new tables"
-- OFF, so the `authenticated` / `anon` API roles never received SELECT/INSERT/
-- UPDATE/DELETE grants on our tables. RLS controls WHICH rows are visible, but
-- a role still needs the base table GRANT to touch the table at all. Direct
-- table reads from the app (e.g. reading memberships) therefore failed with
-- "permission denied for table memberships". (RPC calls worked because they run
-- as SECURITY DEFINER.)
--
-- Fix: grant the standard privileges to authenticated (and read where
-- appropriate), then rely on RLS policies to scope rows per tenant. Also
-- de-recurse the memberships SELECT policy.
-- =============================================================================

-- --- Base table grants (RLS still enforces row visibility) ------------------
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on public.organizations   to authenticated;
grant select, insert, update, delete on public.memberships      to authenticated;
grant select, insert, update, delete on public.member_profiles  to authenticated;
grant select, insert, update, delete on public.linked_accounts  to authenticated;
grant select, insert, update, delete on public.teams            to authenticated;
grant select, insert, update, delete on public.roster_slots     to authenticated;
grant select, insert, update, delete on public.wellbeing_checkins to authenticated;

-- --- De-recurse the memberships SELECT policy -------------------------------
-- Reading your own rows must not call a function that reads memberships.
drop policy if exists "members can read memberships in their orgs" on public.memberships;

create policy "read own memberships"
  on public.memberships for select
  using (user_id = auth.uid());

create policy "admins read org memberships"
  on public.memberships for select
  using (public.is_org_admin(org_id));
