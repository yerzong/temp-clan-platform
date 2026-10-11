-- Revoke the temporary seed grants from 0020. service_role should not retain
-- write access to these tables outside the one-off dev seed.
revoke insert on public.memberships from service_role;
revoke insert on public.member_profiles from service_role;
revoke insert on public.invitations from service_role;
-- Keep SELECT off too (it was only for the seed lookup).
revoke select on public.memberships from service_role;
revoke select on public.member_profiles from service_role;
revoke select on public.organizations from service_role;
revoke select on public.invitations from service_role;
