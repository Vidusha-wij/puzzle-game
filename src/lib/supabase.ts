import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Surfaced clearly during dev if env is missing.
  // eslint-disable-next-line no-console
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url ?? "", key ?? "", {
  realtime: { params: { eventsPerSecond: 30 } },
  auth: { persistSession: false },
});

export const PHOTO_BUCKET = "puzzle-photos";
