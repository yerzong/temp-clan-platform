-- =============================================================================
-- Temp Platform — A member can leave an organization themselves.
--
-- When a user leaves (NOT when an admin removes them), notify the org's
-- owners/admins. Admin removal does not notify, since the admin already knows.
--
-- The owner cannot leave (that would strip the org of its owner). They must
-- transfer ownership or delete the org (out of scope here).
-- =============================================================================

create or replace function public.leave_organization(target_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  my record;
  display text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select m.id, m.role into my
  from public.memberships m
  where m.org_id = target_org
    and m.user_id = current_user_id
  limit 1;

  if my is null then
    raise exception 'You are not a member of this organization';
  end if;

  if my.role = 'owner' then
    raise exception 'The owner cannot leave the organization';
  end if;

  -- Capture the display name before deleting the profile/membership.
  select mp.display_name into display
  from public.member_profiles mp
  where mp.membership_id = my.id;

  -- Notify owners/admins (excluding the leaver) BEFORE deleting the membership.
  insert into public.notifications (org_id, user_id, type, title, body)
  select
    target_org,
    m.user_id,
    'member_left',
    coalesce(display, 'Un miembro') || ' abandonó la organización',
    null
  from public.memberships m
  where m.org_id = target_org
    and m.role in ('owner', 'admin')
    and m.user_id is not null
    and m.user_id <> current_user_id;

  -- Remove the membership (profile cascades via FK).
  delete from public.memberships where id = my.id;
end;
$$;

grant execute on function public.leave_organization(uuid) to authenticated;
