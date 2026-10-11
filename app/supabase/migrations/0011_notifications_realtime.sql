-- =============================================================================
-- Temp Platform — Enable Realtime for notifications.
--
-- So the notification bell updates live (websocket) when a new row is inserted
-- by redeem_invitation, the notifications table must be part of the
-- supabase_realtime publication. RLS still applies to realtime: a client only
-- receives rows it is allowed to SELECT (its own notifications).
-- =============================================================================

do $$
begin
  -- Add the table to the realtime publication if not already a member.
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
