-- =============================================================================
-- Temp Platform — Fix: allow admins/owners to DELETE invitations.
--
-- Bug: migration 0006 created SELECT/INSERT/UPDATE policies for invitations but
-- NO DELETE policy. With RLS enabled, a missing DELETE policy makes Postgres
-- silently delete zero rows — the "Eliminar" button appeared to do nothing and
-- returned no error. A table-level GRANT is not enough; RLS needs an explicit
-- policy. This adds it.
-- =============================================================================

create policy "admins delete invitations"
  on public.invitations for delete
  using (public.is_org_admin(org_id));
