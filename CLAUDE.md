# Dogear — Project Notes for Agents

## What this is
A book club web app called **Dogear**. Members join clubs, suggest books, and rate books they've finished. Indie-bookstore aesthetic: parchment palette, Roboto Slab headings, ink stamps, hard drop-shadow cards.

## Tech stack
- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** — note: uses `@theme inline` with `--color-*` prefix for custom tokens, not the old `tailwind.config.js` `extend.colors` pattern
- **Supabase** (Postgres + Auth + RLS) — project URL: `https://rnzmkyvpcoiastqsadeo.supabase.co`
- **next/font/google** — four fonts loaded: Roboto Slab, DM Sans, JetBrains Mono, Caveat

## Design system
All shared UI primitives are in `components/ui/dogear.tsx` (no `'use client'` — safe for server components):
- `DogearLogo`, `Stamp`, `BookCover`, `Avatar`, `SketchDivider`, `StarRating`, `RatingHistogram`, `StatTile`, `Bookshelf`

`RatingHistogram({ ratings: number[], height? })` — ten bars for scores 1-10, empty buckets keep a stub so the axis reads as a full scale. `StatTile({ label, value, sub?, variant? })` — hard-shadow figure tile. `Bookshelf({ books: ShelfBook[], height? })` — spine view; spine colours come from the shared `coverPalette(title)` helper that `BookCover` also uses.

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
- `.row-link` + `.row-link-title` — a whole row that navigates. Hover/focus tints the row and underlines the title in terracotta; pair with `<LinkPending />` for the chevron. Keep interactive controls (e.g. `RatingButton`) **outside** the `<Link>`, or the row swallows their clicks.
- `.skeleton-line`, `.skeleton-block` — shimmer placeholders for `loading.tsx`; wrap the page in `.skeleton-page` to make it inert.

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
URLs are below; **files live under route groups** — `app/(dashboard)/clubs/[id]/page.tsx`, not `app/clubs/[id]/page.tsx`. `(dashboard)` supplies the Navbar and `max-w-7xl` container; `(auth)` is a narrow centred shell.

```
/login                        Auth (magic link)
/signup                       Auth (magic link — same flow, different headline)
/auth/callback                Exchanges OTP code for session; redirects to /clubs or /settings
/settings                     User profile — update display name
/clubs                        List of user's clubs
/clubs/new                    Create a club
/clubs/[id]                   Club detail (now reading, suggestions, past reads, members, activity)
/clubs/[id]/books/[bookId]    Book detail — blurb, length, per-member verdicts, histogram, history
/clubs/[id]/stats             League table — rankings, club totals, member awards
/clubs/[id]/settings          Club settings — admin only (edit name/description/cadence, reset data)
/clubs/[id]/search            Search Google Books + suggest a book
/join                         Join a club via 6-char invite code
```

Auth is enforced by `proxy.ts` (Next 16's renamed middleware — **not** `middleware.ts`). Its matcher already covers `/clubs*` and `/join*`, so new routes under those prefixes are protected automatically; anything outside them needs the matcher extended.

New server pages should type params as `{ params: Promise<{ id: string }> }` and `await params`. Some older pages use `await Promise.resolve(params)` against a sync type — that's a legacy workaround, don't copy it.

## Database schema

### Keeping `types/database.ts` honest
`types/database.ts` is **hand-written, not generated** (`supabase gen types` has never been run here — note the empty `Relationships` and missing `Functions`). It therefore drifts from the real schema, and has twice declared columns that don't exist. Don't trust it as a description of the database.

There are no migration files either — schema changes are applied by hand in the Supabase dashboard, so a column can be added in one place and not the other.

To check a declared column actually exists, without a service_role key (PostgREST validates column names before RLS, so an invalid name 400s even with no rows readable):

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/<table>?select=<column>&limit=0" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# 200 = exists, 400 = does not
```

### Tables
- **profiles** — `id, email, display_name, avatar_url, created_at`
- **clubs** — `id, name, description, admin_id, invite_code, rotation_rule, schedule_weeks, created_at`
- **club_members** — `id, club_id, user_id, joined_at, turn_order`
- **club_books** — `id, club_id, google_books_id, title, author, cover_url, page_count, picked_by, status ('suggested'|'active'|'completed'), is_secret, start_date, deadline, completed_at, description, categories (text[]), published_date (text), created_at`
  - `description` / `categories` / `published_date` come from Google Books and are saved at suggest time. Rows created before that existed have NULLs, so the book page falls back to `getVolume()`. `published_date` is `text` not `date` because Google returns `"2003"`, `"2003-05"` and `"2003-05-12"` interchangeably.
  - `completed_at` is set by `BookActions.tsx` on "Mark Complete" and drives past-reads ordering. Pre-existing rows were backfilled from `coalesce(deadline, created_at)`, so their order reflects deadline, not a true finish date.
- **book_ratings** — `book_id (→ club_books.id), user_id, rating (1-10), updated_at`. **The single source of truth for ratings.** No surrogate `id` — it's keyed on `(book_id, user_id)`, which is why `RatingButton` upserts with `onConflict: 'book_id,user_id'`.
- **user_book_progress** — `id, club_book_id, user_id, status ('not_started'|'reading'|'completed'), started_at, completed_at`
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
- **`lib/utils/truncateTitle.ts`** — `truncateTitle(title, limit = 40)` with an ellipsis.
- **`lib/utils/stripHtml.ts`** — `stripHtml(text)`. Google Books descriptions are HTML fragments (`<p>`, `<br>`, `<b>`, plus named and numeric entities). It is third-party content, so it is flattened to plain text and **never** passed to `dangerouslySetInnerHTML`.
- **`lib/utils/clubStats.ts`** — all league-table maths, computed in JS (clubs are tiny; no SQL aggregates). Key definitions:
  - `MIN_RATINGS = 2` — a book needs two ratings to be ranked, so a lone 10/10 can't top the table. One-rating books surface separately via `singleVerdictBooks()`.
  - `MIN_RATED = 3` — books a member must have rated to qualify for average-based awards.
  - Divisiveness uses **population** standard deviation (÷n, not n−1) — the sample version inflates 2-5 rater groups.
  - `contrarianScore` is **leave-one-out**: a member's gap from everyone *else's* average. Including themselves makes all members identical when only two rated.
  - Every function returns `null`/`[]` rather than dividing by zero — a brand-new club must not render `NaN`.
  - **No suggestion or activation metrics.** They were deliberately removed: the club predates the app, so the admin backdated books and suggested/activated entries that weren't theirs, making `picked_by` unrepresentative. Picking also rotates by turn, so the counts carried no signal. Don't reintroduce them off the back of `picked_by`.

## External APIs
- **Google Books API** — key in `.env.local` as `GOOGLE_BOOKS_API_KEY`. Without a key it hits quota almost immediately. Route: `app/api/books/search/route.ts` → `lib/api/googleBooks.ts`.
  - `searchBooks(query)` — multi-strategy search with relevance ranking; `cache: 'no-store'`.
  - `getVolume(volumeId)` — single volume by id, used by the book page to backfill a missing description. Cached 24h (`next: { revalidate: 86400 }`) since volume metadata is static; returns `null` rather than throwing on 404, so a stale id degrades to "no description".
  - Saved to `club_books` on suggestion: `pageCount`, `description` (stripped), `categories`, `publishedDate`, title/authors/thumbnail.
  - **The two endpoints return different description formats.** `/volumes/{id}` (getVolume) returns the full description **with HTML** (`<b>`, `<br>`); `/volumes?q=` (search) returns a shorter **plain-text** snippet for the same volume. Everything is run through `stripHtml` regardless, so the format can change without breaking the UI.

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

## Book detail page
`/clubs/[id]/books/[bookId]` — reached from past reads, the active book title/cover, and non-secret suggestion rows on the club page. **Mystery cards are deliberately not linked**, so the detail route can't be used as a peephole.

Two layers guard it: the `cb_select` RLS policy (a guessed URL for someone else's secret suggestion returns no row → `notFound()`), plus an explicit `book.club_id !== id` check so a valid book id from another club can't render under this club's header. Keep both if you touch this page.

## Navigation feedback
**Always use `next/link`, never a bare `<a href="/...">`** for internal routes. Plain anchors trigger a full page reload (white flash, lost client state, re-running every server query). The Navbar, `DogearLogo` and `AuthForm` all used to do this and were converted; the `@next/next/no-html-link-for-pages` lint rule catches regressions.

`components/ui/LinkPending.tsx` (`'use client'`) uses Next 16's `useLinkStatus()` from `next/link`, which reads the pending state of the **nearest enclosing `<Link>`** — so it must be rendered as a child of one, and the surrounding page can stay a server component. It shows a chevron at rest and a spinner while navigating, in the same box so rows don't reflow.

Both `/clubs/[id]/books/[bookId]` and `/clubs/[id]/stats` have a `loading.tsx` skeleton. The book page's matters most: it may call `getVolume()` to backfill a missing description, so it can be on screen for a moment.

## League table
`/clubs/[id]/stats` — linked from the club header for **all** members, not just admins. Rankings, club totals, a `Bookshelf` of finished reads, member awards, and a full member table. All maths lives in `lib/utils/clubStats.ts` (see Utilities).

## What's intentionally not implemented
The DB schema doesn't support these features so they were skipped in the UI:
- Upvote counts on suggestions (no votes table)
- Discover / My Shelf pages (no routes exist)

Deferred but cheap once wanted: written mini-reviews (`review` column on `book_ratings`), per-member pages with taste-match scores, and reading-progress history on finished books (the club page only queries `user_book_progress` for *active* books, so a finished book's progress rows are never read).
