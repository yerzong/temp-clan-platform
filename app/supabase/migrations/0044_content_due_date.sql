-- =============================================================================
-- Temp Platform — content pieces gain an optional due date (deadline).
--
-- Reassigning the creator already works via the existing membership_id column
-- (direct update under RLS); this just adds a deadline for pipeline urgency.
-- =============================================================================

alter table public.content_pieces
  add column if not exists due_date date;
