# Dogear — Project Notes for Agents

## What this is
A book club web app called **Dogear**. Members join clubs, suggest books, vote on what to read next, and rate books they've finished. Indie-bookstore aesthetic: parchment palette, Roboto Slab headings, ink stamps, hard drop-shadow cards.

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
- `.h-display`, `.h-section`, `.eyebrow`, `.label-mono` — typography
- `.sketch-underline` — wavy terracotta underline via SVG background-image
- `.kraft-bg`, `.paper-bg` — background fills

## Routes
```
/login                        Auth
/signup                       Auth
/clubs                        List of user's clubs
/clubs/new                    Create a club
/clubs/[id]                   Club detail (now reading, suggestions, past reads, members)
/clubs/[id]/search            Search Google Books + suggest a book
/join                         Join a club via 6-char invite code
```

## Database schema

### Tables
- **profiles** — `id, email, display_name, avatar_url, created_at`
- **clubs** — `id, name, description, admin_id, invite_code, rotation_rule, schedule_weeks, created_at`
- **club_members** — `id, club_id, user_id, joined_at, turn_order`
- **club_books** — `id, club_id, google_books_id, title, author, cover_url, picked_by, status ('suggested'|'active'|'completed'), start_date, deadline, created_at`
- **book_ratings** — `id, book_id (→ club_books.id), user_id, rating (1-10), updated_at`
- **user_book_progress** — `id, club_book_id, user_id, status ('not_started'|'reading'|'completed'), started_at, completed_at, rating`

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

**club_members policies** — must NOT self-reference (causes infinite recursion). Use simple `user_id = auth.uid()` only:
```sql
create policy "cm_select" on club_members for select using (user_id = auth.uid());
create policy "cm_insert" on club_members for insert with check (user_id = auth.uid());
create policy "cm_delete" on club_members for delete using (user_id = auth.uid());
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

## External APIs
- **Google Books API** — key in `.env.local` as `GOOGLE_BOOKS_API_KEY`. Without a key it hits quota almost immediately. Route: `app/api/books/search/route.ts` → `lib/api/googleBooks.ts`.

## What's intentionally not implemented
The DB schema doesn't support these features so they were skipped in the UI:
- Per-member reading progress % (only `status: not_started|reading|completed`)
- Upvote counts on suggestions (no votes table)
- Activity feed (no events table)
- Discover / My Shelf pages (no routes exist)
