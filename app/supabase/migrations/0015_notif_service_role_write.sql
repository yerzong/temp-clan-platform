-- Allow service_role full access to notifications (backend-only role).
grant select, insert, update, delete on public.notifications to service_role;
