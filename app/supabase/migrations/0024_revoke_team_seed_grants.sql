-- Revoke the temporary team seed grants from 0023.
revoke insert on public.teams from service_role;
revoke insert on public.roster_slots from service_role;
revoke select on public.teams from service_role;
revoke select on public.roster_slots from service_role;
revoke select on public.organizations from service_role;
revoke select on public.memberships from service_role;
revoke select on public.member_profiles from service_role;
