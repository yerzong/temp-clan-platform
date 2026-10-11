-- TEMP: grants so a service_role seed can insert dev teams/slots. Revoked by 0024.
grant select, insert on public.teams to service_role;
grant select, insert on public.roster_slots to service_role;
grant select on public.organizations to service_role;
grant select on public.memberships to service_role;
grant select on public.member_profiles to service_role;
