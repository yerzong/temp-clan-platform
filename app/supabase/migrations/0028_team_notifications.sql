-- =============================================================================
-- Temp Platform — Notify owners/admins when a team is created / edited / deleted.
-- Reuses the notifications table (which broadcasts in realtime via 0016).
-- The actor (auth.uid()) is excluded from the recipients.
-- =============================================================================

create or replace function public.notify_team_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_team_name text;
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_title text;
begin
  if tg_op = 'DELETE' then
    v_org := old.org_id;
    v_team_name := old.name;
  else
    v_org := new.org_id;
    v_team_name := new.name;
  end if;

  -- Actor's display name within this org (best effort).
  select mp.display_name into v_actor_name
  from public.memberships m
  join public.member_profiles mp on mp.membership_id = m.id
  where m.org_id = v_org and m.user_id = v_actor
  limit 1;
  v_actor_name := coalesce(v_actor_name, 'Alguien');

  if tg_op = 'INSERT' then
    v_title := v_actor_name || ' creó el equipo "' || v_team_name || '"';
  elsif tg_op = 'UPDATE' then
    -- Only notify on meaningful meta changes (name/game/platform).
    if new.name is distinct from old.name
       or new.game is distinct from old.game
       or new.platform is distinct from old.platform then
      v_title := v_actor_name || ' editó el equipo "' || v_team_name || '"';
    else
      return coalesce(new, old);
    end if;
  else
    v_title := v_actor_name || ' eliminó el equipo "' || v_team_name || '"';
  end if;

  insert into public.notifications (org_id, user_id, type, title, body)
  select v_org, m.user_id, 'team_' || lower(tg_op), v_title, null
  from public.memberships m
  where m.org_id = v_org
    and m.role in ('owner', 'admin')
    and m.user_id is not null
    and m.user_id is distinct from v_actor;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_notify_team_change on public.teams;
create trigger trg_notify_team_change
  after insert or update or delete on public.teams
  for each row
  execute function public.notify_team_change();
