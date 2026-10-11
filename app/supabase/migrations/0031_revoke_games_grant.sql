-- Revoke the temporary games write grant from 0030.
revoke update on public.games from service_role;
revoke select on public.games from service_role;
