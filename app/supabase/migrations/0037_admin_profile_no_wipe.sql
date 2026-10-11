-- =============================================================================
-- Temp Platform — admin_update_member_profile must not wipe fields left blank.
-- Treat empty inputs as "leave unchanged" (COALESCE), so editing contact info
-- without re-entering everything doesn't clear birth_date/nationality/etc.
-- =============================================================================

create or replace function public.admin_update_member_profile(
  p_membership_id uuid,
  p_username text,
  p_email text,
  p_birth_date date,
  p_nationality text,
  p_phone text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'Member not found';
  end if;
  if not public.is_org_admin(v_org) then
    raise exception 'Only an admin or owner can edit member profiles';
  end if;

  update public.member_profiles
  set
    username = coalesce(nullif(trim(coalesce(p_username, '')), ''), username),
    email = coalesce(nullif(trim(coalesce(p_email, '')), ''), email),
    birth_date = coalesce(p_birth_date, birth_date),
    nationality = coalesce(nullif(trim(coalesce(p_nationality, '')), ''), nationality),
    phone = coalesce(nullif(trim(coalesce(p_phone, '')), ''), phone),
    avatar_url = coalesce(nullif(trim(coalesce(p_avatar_url, '')), ''), avatar_url)
  where membership_id = p_membership_id;
end;
$$;

grant execute on function public.admin_update_member_profile(uuid, text, text, date, text, text, text) to authenticated;
