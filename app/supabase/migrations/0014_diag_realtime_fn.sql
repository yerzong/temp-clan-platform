-- Temporary diagnostic: expose publication membership + replica identity so we
-- can confirm Realtime is configured for notifications. Dropped in a later
-- migration once verified.
create or replace function public.diag_realtime()
returns table (tablename text, relreplident char)
language sql
security definer
set search_path = public
as $$
  select t.tablename::text, c.relreplident
  from pg_publication_tables t
  join pg_class c on c.relname = t.tablename
  where t.pubname = 'supabase_realtime' and t.schemaname = 'public';
$$;

grant execute on function public.diag_realtime() to service_role, authenticated;
