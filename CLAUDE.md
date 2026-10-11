# Temp Platform — Project Handoff for Claude Code

> This file is the working context for continuing development. It was written as a handoff
> so a fresh assistant (Claude Code in the terminal) can pick up the project without losing
> state. Read it fully before making changes.

## How to talk to the developer (Gerson)

- **Reply in Spanish.** Gerson writes in Spanish; answer in Spanish, warm and direct.
- **Code, identifiers, comments, commit messages, UI copy → the existing convention of this repo.**
  The app's UI is almost entirely in **Spanish** (user-facing strings, labels, toasts). Match that:
  new UI copy is Spanish. Code symbols, comments and commit messages are in **English**.
- Keep commits small and conventional (`feat:`, `fix:`, `refactor:`, `chore:`). **No AI attribution** in commits.
- Gerson tests live in the browser while you build. Prefer shipping working increments.

## What this project is

**Temp Platform** — a multi-tenant SaaS for gaming/esports organizations (first client: TEMP TACTICAL).
Tactical Gears/COG visual theme: red-amber accents over gunmetal dark surfaces.

Modules already built: **Miembros** (roster), **Esports** (teams + named slots + collectible player
cards), **Content** (kanban pipeline), **Temp League**, **Invitaciones**, **Notificaciones** (realtime),
**Perfil**, **Onboarding** (post-Discord wizard), **Twitch live detection**.

## Stack & layout

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind** + **shadcn-style UI**.
- **Supabase** (Postgres + Auth via Discord OAuth + Storage + Realtime). Project ref `ozqjkxdhwojlukkkeuop`.
- The app lives in the **`app/`** subfolder, NOT the repo root. Run everything from `app/`.
- Repo: `github.com/yerzong/temp-clan-platform`, branch `main`. Last pushed commit: `cc0b276`.

```
app/
  src/
    app/                      # Next.js routes (App Router)
      page.tsx                # public landing
      login/ onboarding/      # auth + post-Discord onboarding wizard
      auth/callback/          # Discord OAuth callback
      invite/[token]/         # invitation redemption
      dashboard/              # authed area: members, esports, content, league, invitations
    components/
      ui/                     # reusable primitives (button, card, sheet, combobox, pagination…)
      layout/                 # app-shell, side-nav, page-header, summary-card…
    features/
      members/                # roster: service, actions, components (role-picker, cards, forms)
      esports/                # teams, slots, player cards, twitch-service
      profile/                # profile editor, onboarding-form, avatar-uploader, countries, brand-icon
      organizations/ content/ league/ invitations/ notifications/
    lib/
      domain/types.ts         # shared domain types
      supabase/               # client/server helpers
  supabase/migrations/        # SQL migrations, applied up to 0037
```

## Architecture conventions (follow these)

- **Feature-first.** Each feature owns a `*-service.ts` (data access via Supabase), an `actions.ts`
  (Next.js server actions, `"use server"`), and `components/`. **The UI never queries Supabase
  directly** — it goes through the service, which returns a `Result<T>` (`{ ok: true, data } | { ok: false, error }`).
- **Server actions return `ActionResult` (`{ error?: string }`)** and `revalidatePath` on success.
- **Postgres RPCs** back the privileged writes (e.g. `admin_update_member`, `add_org_member`,
  `update_my_profile`, `upsert_my_account`, `create_slot_invitation`, `redeem_invitation`). RLS is
  active — don't bypass it. The `role` enum only distinguishes `owner`/`admin` for permissions;
  non-admin members use `role='staff'` as a neutral value. **Do not touch the `role` enum or RLS**
  without strong reason — it underpins teams/esports/invitations.
- **Member functions model**: `member_profiles.is_staff / is_player / is_creator` are independent
  booleans (multi-select). **Admin** is a separate permission (`role='admin'`) and is **exclusive**:
  selecting admin clears functions and vice-versa. See `features/members/components/role-picker.tsx`.
- **Theme tokens** are CSS vars: `hsl(var(--tc-accent))`, `--tc-fg`, `--tc-border`, `--tc-surface-*`,
  `--tc-amber`, etc. Use the `tc-*` utility classes and tokens, not hardcoded colors.
- Animations: reuse `tc-animate-in`, `tc-dialog-in`, `tc-stagger` from `globals.css`.

## Running & verifying

- Dev server: `npm run dev` in `app/` (http://localhost:3000).
- **Do NOT rely on `tsc` for a quick check — it tends to hang here.** Verify by hitting routes:
  `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/<route>` →
  **200** = ok public, **307** = auth redirect (also ok, means it compiled), **500** = error.
  Also read the dev server output for `✓ Compiled` and runtime errors.
- **Gotcha**: a brand-new route can 404/stale until you clear `.next` (`find .next -depth -delete`)
  and restart the dev server.
- Migrations: `supabase db push --yes` (the `--yes` avoids the interactive prompt hanging).

## Database notes

- Migrations applied up to **0037** (`0036_member_functions.sql` added `is_staff` + admin RPCs;
  `0037_admin_profile_no_wipe.sql` uses COALESCE so admin edits don't wipe blank fields).
- **Orphan table**: `wellbeing_checkins` still exists in the DB but the "player sustainability/
  wellbeing" feature was removed from the code (commit `cc0b276`). It's unused. A cleanup migration
  to drop it is OPTIONAL and pending Gerson's go-ahead — don't drop it unprompted.
- Storage bucket `avatars` holds uploaded profile photos.
- Game covers come from the **RAWG API** (key is already in use in the esports service), with a
  stylized gradient fallback per game.
- **Twitch live detection**: `features/esports/twitch-service.ts` uses `TWITCH_CLIENT_ID` /
  `TWITCH_CLIENT_SECRET` from `app/.env.local` (client-credentials token, cached). Only Twitch is
  detectable today; YouTube/Facebook/X are deferred. Account verification is manual-by-admin for now.

## Recently finished (this session)

1. **Members role redesign** — selectable role cards: multi functions + exclusive Admin
   (`role-picker.tsx`), used in add/edit forms. Admin edits a member's full profile too.
2. **Roster single-group** — each member shows once in their primary group (priority
   Admin > Jugador > Creador > Staff); filtering by a function shows everyone with that function.
3. **Richer player profile modal** — hero header (big centered photo) + FactTile grid. Shared by
   Members (eye button) and esports team cards.
4. **Avatar upload in edit-member contact form** (preview + file upload to Storage).
5. **Fix**: admin-only member no longer rejected by the "at least one function" validation.
6. **Interactive onboarding wizard** — 3 steps (photo+name / details / privacy) with a stepper,
   `tc-animate-in` transitions, controlled fields mirrored into hidden inputs so steps can re-mount
   without losing data. See `features/profile/components/onboarding-form.tsx`.
7. **Searchable Combobox** (`components/ui/combobox.tsx`) with flag emojis, replacing native
   `<select>` for nationality + dial code in onboarding. Nicer privacy toggle. Fields in step 2 are
   optional (stated in UI). Dial options use ISO country code as value (several countries share `+1`).
8. **Removed the player wellbeing/sustainability feature** end-to-end (panels, forms, service
   methods, types, dashboard card, landing card).

## Suggested next steps (Gerson's backlog — ask which he wants)

- **Multi-login**: email/password + Google (Supabase native). Apple needs a paid Apple account.
- **"En vivo ahora" module** on the dashboard, reusing the existing Twitch detection.
- Polish the **dashboard / Overview**.
- **Responsive / mobile** pass across the app.
- Optional: apply the new searchable **Combobox** to the other forms still using native `<select>`
  (profile editor, add-member, edit-member).
- Optional: cleanup migration to drop the orphan `wellbeing_checkins` table.

## Guardrails

- Don't push to `main` without Gerson's OK; he likes to batch commits and review first.
- Prefer new commits over amend/force. Don't change git config. Flag any secret files before committing.
- `app/.env.local` holds secrets (Supabase keys, Twitch creds) — never print or commit their values.
