-- TEMP: grants so a service_role seed script can insert dev test data.
-- Revoked immediately after seeding by 0021.
grant select, insert on public.memberships to service_role;
grant select, insert on public.member_profiles to service_role;
grant select on public.organizations to service_role;
grant select, insert on public.invitations to service_role;
