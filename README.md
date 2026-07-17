# Jigsaw Booth 🧩

A two-screen live jigsaw puzzle booth (Next.js + Supabase realtime).

- **`/display`** — the big vertical screen (driven by the tablet). Read-only mirror:
  attract artwork → live puzzle mirror + timer → leaderboard, then auto-returns.
- **`/play`** — the laptop the player holds. Play now → name + phone → upload a
  photo → solve the jigsaw. The phone number is **masked** on the big screen.
- **`/`** — landing page linking the two roles.
- **`/preview`** — dev-only harness to eyeball the puzzle without Supabase. Safe to delete.

The two screens sync through a single Supabase row (`game_state`, `id='singleton'`):
the laptop is the "driver" and writes state + broadcasts live piece motion; the
display subscribes and mirrors. Scores land in the `leaderboard` table; photos go
to the public `puzzle-photos` storage bucket.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```

Environment (`.env.local`, already set for the celogen-jigsaw-puzzle project):

```
NEXT_PUBLIC_SUPABASE_URL=https://ymoaeibvugnuofeiovdv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Drop your attract artwork at **`public/hero.jpg`** (portrait works best for the
big screen). Until then a placeholder shows.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project settings
   (they are not committed — `.env.local` is gitignored).
3. Open `/display` on the tablet and `/play` on the laptop. Done.

## Supabase backend

Already provisioned on project `celogen-jigsaw-puzzle`:

- `game_state` (singleton sync row) + `leaderboard` tables, both in the realtime publication.
- Public storage bucket `puzzle-photos`.
- Anonymous RLS policies for read/update `game_state`, insert/read `leaderboard`,
  and read/upload `puzzle-photos`.
