# Dogear — Project Notes for Agents

## What this is
A book club web app called **Dogear**. Members join clubs, suggest books, and rate books they've finished. Indie-bookstore aesthetic: parchment palette, Roboto Slab headings, ink stamps, hard drop-shadow cards.

## Tech stack
- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** — note: uses `@theme inline` with `--color-*` prefix for custom tokens, not the old `tailwind.config.js` `extend.colors` pattern
- **Supabase** (Postgres + Auth + RLS) — project URL: `https://rnzmkyvpcoiastqsadeo.supabase.co`
- **next/font/google** — four fonts loaded: Roboto Slab, DM Sans, JetBrains Mono, Caveat

## Design system
All shared UI primitives are in `components/ui/dogear.tsx` (no `'use client'` — safe for server components):
- `DogearLogo`, `Stamp`, `BookCover`, `Avatar`, `SketchDivider`, `StarRating`, `ProgressBar`

CSS utility classes are in `app/globals.css`. Key ones:
- `.card` — ink border + 4px 4px 0 drop shadow
- `.lift` — hover lifts card (translate -2px -2px, bigger shadow)
- `.btn`, `.btn-primary`, `.btn-accent`, `.btn-paper`, `.btn-ghost`, `.btn-sm`
- `.stamp`, `.stamp-red`, `.stamp-green`, `.stamp-brown`, `.stamp-ink`
- `.field`, `.field-label` — form inputs
- `.h-display`, `.h-section`, `.eyebrow`, `.label-mono` — typography (no font-size set — specify via Tailwind `text-*` classes)
- `.sketch-underline` — wavy terracotta underline via SVG background-image
- `.kraft-bg`, `.paper-bg` — background fills
- `.nav-link` — navigation anchor with hover state (replaces JS onMouseEnter/onMouseLeave)

## Styling conventions
- **Tailwind-first for layout**: use Tailwind utilities for all flex, grid, gap, padding, margin, sizing. Responsive prefixes: `sm:` (640px), `md:` (768px), `lg:` (1024px).
- **globals.css classes for design**: `.card`, `.btn`, `.stamp`, etc. handle the Dogear aesthetic — don't duplicate these with inline styles.
- **Inline styles only for**: genuinely dynamic/computed values (hash-derived avatar/cover colours, JS-driven interaction states like selected ratings or focus transforms). Never for static layout.
- **CSS layer gotcha**: globals.css classes are unlayered CSS and have higher cascade priority than Tailwind's `@layer utilities`. This means a Tailwind responsive utility like `md:hidden` will be overridden by a class that sets `display` (e.g. `.btn { display: inline-flex }`). Workaround: wrap the element in a plain `<div className="md:hidden">` instead of putting the responsive class on the element itself.
- **Heading sizes**: `.h-display` and `.h-section` set font-family/weight/tracking but not size. Always pair with a Tailwind size, e.g. `className="h-display text-4xl sm:text-5xl"`. Use responsive sizes for large headings so they scale down on mobile.

## Auth
Passwordless magic link via Supabase `signInWithOtp`. No passwords — login and signup are the same form (both call `signInWithOtp`). The `mode` prop controls headline copy only.

- `AuthForm` (`components/auth/AuthForm.tsx`) — collects email + optional display name, sends magic link, shows "Check your inbox" confirmation state
- `app/auth/callback/route.ts` — exchanges the OTP `code` for a session; redirects new users (no `display_name` on profile) to `/settings`, returning users to `/clubs`
- Session persistence: Supabase cookies managed by `lib/supabase/server.ts` + `proxy.ts` middleware. Increase refresh token expiry in Supabase dashboard (Authentication → Configuration → Sessions) to 30–90 days for "stay logged in" behaviour
- Sign out (`scope: 'local'` default) logs out current device only

## Routes
```
/login                        Auth (magic link)
/signup                       Auth (magic link — same flow, different headline)
/auth/callback                Exchanges OTP code for session; redirects to /clubs or /settings
/settings                     User profile — update display name
/clubs                        List of user's clubs
/clubs/new                    Create a club
/clubs/[id]                   Club detail (now reading, suggestions, past reads, members, activity)
/clubs/[id]/settings          Club settings — admin only (edit name/description/cadence, reset data)
/clubs/[id]/search            Search Google Books + suggest a book
/join                         Join a club via 6-char invite code
```

## Database schema

### Tables
- **profiles** — `id, email, display_name, avatar_url, created_at`
- **clubs** — `id, name, description, admin_id, invite_code, rotation_rule, schedule_weeks, created_at`
- **club_members** — `id, club_id, user_id, joined_at, turn_order`
- **club_books** — `id, club_id, google_books_id, title, author, cover_url, page_count, picked_by, status ('suggested'|'active'|'completed'), is_secret, start_date, deadline, created_at`
- **book_ratings** — `id, book_id (→ club_books.id), user_id, rating (1-10), updated_at`
- **user_book_progress** — `id, club_book_id, user_id, status ('not_started'|'reading'|'completed'), started_at, completed_at, rating`
- **club_events** — `id, club_id, actor_id, event_type, book_id, payload (jsonb), created_at`

### Admin model
Admin is determined by `clubs.admin_id = auth.uid()`. There is **no role column** on `club_members`.

### RLS setup (important — has been fixed from defaults)

**Trigger function** — must use `security definer set search_path = public`, otherwise the default search path doesn't include `public` and the trigger can't find the `profiles` table:
```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
```

**club_members policies** — the SELECT policy uses `is_club_member` (which is `security definer` and bypasses RLS internally, so no recursion). The admin delete policy allows club admins to remove members:
```sql
create policy "cm_select" on club_members for select using (public.is_club_member(club_id));
create policy "cm_insert" on club_members for insert with check (user_id = auth.uid());
create policy "cm_delete" on club_members for delete using (user_id = auth.uid());
create policy "cm_admin_delete" on club_members for delete using (
  exists (select 1 from public.clubs where clubs.id = club_members.club_id and clubs.admin_id = auth.uid())
);
```

**clubs policies** — use a `security definer` helper function for membership checks to avoid RLS recursion:
```sql
create or replace function public.is_club_member(p_club_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from public.club_members where club_id = p_club_id and user_id = auth.uid());
$$;

create policy "clubs_select" on clubs for select
  using (public.is_club_member(id) or admin_id = auth.uid());
create policy "clubs_insert" on clubs for insert with check (true);
create policy "clubs_update" on clubs for update using (admin_id = auth.uid());
create policy "clubs_delete" on clubs for delete using (admin_id = auth.uid());
```
The `admin_id = auth.uid()` on `clubs_select` is required so a user can read back the club immediately after inserting it (before they're added as a member). Without it, `INSERT ... RETURNING *` returns a 403.

**club_books policies** — secret suggested books are hidden from everyone except the suggester and the club admin, until activated:
```sql
create policy "cb_select" on club_books for select
  using (
    public.is_club_member(club_id) and (
      picked_by = auth.uid()
      or status in ('active', 'completed')
      or not is_secret
      or exists (
        select 1 from public.clubs
        where clubs.id = club_books.club_id
          and clubs.admin_id = auth.uid()
      )
    )
  );
```

**Invite code lookup** — the clubs RLS policy blocks non-members from querying clubs, so joining by invite code uses a `security definer` RPC instead of a direct SELECT:
```sql
create or replace function public.get_club_id_by_invite_code(p_code text)
returns uuid
language sql security definer set search_path = public stable
as $$
  select id from public.clubs where invite_code = upper(p_code);
$$;
```
Called via `supabase.rpc('get_club_id_by_invite_code', { p_code })` in `components/clubs/JoinClubForm.tsx`.

**club_events policies** — club members can select; users can only insert their own events:
```sql
create policy "ce_select" on club_events for select
  using (public.is_club_member(club_id));
create policy "ce_insert" on club_events for insert
  with check (public.is_club_member(club_id) and actor_id = auth.uid());
```

**user_book_progress policies** — club members can see all progress for books in their clubs; users can only write their own rows:
```sql
create policy "ubp_select" on user_book_progress for select
  using (
    exists (
      select 1 from public.club_books cb
      where cb.id = user_book_progress.club_book_id
        and public.is_club_member(cb.club_id)
    )
  );
create policy "ubp_insert" on user_book_progress for insert
  with check (user_id = auth.uid());
create policy "ubp_update" on user_book_progress for update
  using (user_id = auth.uid());
```

## Secret suggestions
Members can suggest a book with `is_secret: true`. While secret and `status = 'suggested'`:
- The suggester sees their book normally with a "Secret" stamp
- Other members cannot see it (RLS hides it)
- The admin sees a mystery card (black `?` cover, "Secret suggestion" title) with a "Reveal & Activate →" button
- On activation, `is_secret` is set to `false` and `status` to `active` simultaneously

## Activity feed (`club_events`)
Events are inserted app-side (not via DB triggers) immediately after each action. Event types and their payload shapes:
- `book_suggested` — `{ book_title?, is_secret: bool }` (title omitted when secret)
- `book_activated` — `{ book_title, was_secret: bool }`
- `book_completed` — `{ book_title }`
- `book_rated` — `{ book_title, rating: number }`
- `member_joined` — `{}`

Components that insert events: `search/page.tsx`, `ActivateBookButton.tsx`, `BookActions.tsx`, `RatingButton.tsx`, `JoinClubForm.tsx`.

The feed is rendered by `components/clubs/ActivityFeed.tsx` (server component) at the bottom of the club detail page.

## Reading progress (`user_book_progress`)
Shown on the active book card via `components/clubs/ReadingProgress.tsx` (client component). Each member has a status chip (grey = Not started, amber = Reading, green = Finished). Members click their own chip to cycle through the three states; it upserts to `user_book_progress` optimistically. Other members' statuses are read-only.

## Utilities
- **`lib/utils/readingTime.ts`** — `formatReadingTime(pages)` returns `{ read, listen }` formatted strings (e.g. `"5h 20m"`). 1 page ≈ 1 min reading (250 wpm), 1.75 min listening (155 wpm). Used on the club detail page and the search confirmation card.
- **`lib/utils/inviteCode.ts`** — generates the 6-char alphanumeric invite codes.
- **`lib/utils/queryParser.ts`** — optimises raw search strings before sending to Google Books.

## External APIs
- **Google Books API** — key in `.env.local` as `GOOGLE_BOOKS_API_KEY`. Without a key it hits quota almost immediately. Route: `app/api/books/search/route.ts` → `lib/api/googleBooks.ts`. The `pageCount` field from `volumeInfo` is saved to `club_books.page_count` on suggestion.

## Admin RPC functions

**`reset_club(p_club_id uuid)`** — deletes all books, ratings, progress, and events for a club. Members are kept. Verifies `auth.uid()` is the club admin before deleting. Called from `ResetClubButton.tsx`.
```sql
create or replace function public.reset_club(p_club_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from clubs where id = p_club_id and admin_id = auth.uid()) then
    raise exception 'Not authorised';
  end if;
  delete from book_ratings where book_id in (select id from club_books where club_id = p_club_id);
  delete from user_book_progress where club_book_id in (select id from club_books where club_id = p_club_id);
  delete from club_books where club_id = p_club_id;
  delete from club_events where club_id = p_club_id;
end; $$;
```

## Admin UI

- **Remove member** — `RemoveMemberButton.tsx` in the members list. Two-step confirm (click × → "Remove?" → Yes). Requires `cm_admin_delete` RLS policy above.
- **Club settings** — `/clubs/[id]/settings` page with `EditClubForm.tsx` (name, description, cadence) and `ResetClubButton.tsx` (requires typing "RESET"). Linked from the "You are admin" stamp on the club detail page.
- **Share invite** — `ShareInviteButton.tsx`: native share sheet on touch devices, clipboard copy on desktop.

## Versioning & deployment

**Platform:** Vercel (project: `karl-dudleys-projects/book-club`)
**Production URL:** https://dogearclub.vercel.app

GitHub (`karldudley/book-club`) is connected to Vercel — **no separate deploy step needed**:
- Push to `main` → automatic production deploy
- Open a PR → automatic preview deploy (unique URL)

### Check recent deployments
```bash
vercel ls
```

### Rollback to a previous deployment
```bash
vercel rollback          # rolls back to previous production deploy
```

### Environment variables
Managed in the Vercel dashboard (not committed). Required vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_BOOKS_API_KEY`

Local dev: copy these into `.env.local` (gitignored).

### Versioning
No formal semver — deploy straight from `main`. The `package.json` version (`0.1.0`) is not incremented per release.

## Commit messages
Keep messages short (max 20 words). Do not mention Claude, Claude Code, or any AI agent in commit messages.

## What's intentionally not implemented
The DB schema doesn't support these features so they were skipped in the UI:
- Upvote counts on suggestions (no votes table)
- Discover / My Shelf pages (no routes exist)
