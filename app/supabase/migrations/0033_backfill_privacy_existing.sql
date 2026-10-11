-- =============================================================================
-- Temp Platform — Grandfather existing linked members past onboarding.
--
-- The onboarding gate redirects linked members whose privacy_accepted_at is
-- null to /onboarding. Members who joined BEFORE onboarding existed shouldn't
-- be forced through it, so mark their privacy as accepted now. New members
-- (future redemptions) still start with null and go through onboarding.
-- =============================================================================

update public.member_profiles mp
set privacy_accepted_at = now()
from public.memberships m
where mp.membership_id = m.id
  and m.user_id is not null
  and mp.privacy_accepted_at is null;
