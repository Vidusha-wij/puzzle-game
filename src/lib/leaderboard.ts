import { supabase } from "./supabase";
import { LeaderboardRow } from "./types";

/** Insert a score and return its 1-based rank (by fastest time). */
export async function submitScore(
  name: string,
  phone: string,
  timeMs: number
): Promise<{ rank: number; id: number | null }> {
  const { data, error } = await supabase
    .from("leaderboard")
    .insert({ name, phone, time_ms: timeMs })
    .select("id")
    .single();

  if (error) console.error("leaderboard insert failed:", error.message);

  const { count } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .lt("time_ms", timeMs);

  return { rank: (count ?? 0) + 1, id: data?.id ?? null };
}

export async function fetchTop(limit = 10): Promise<LeaderboardRow[]> {
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("time_ms", { ascending: true })
    .limit(limit);
  return (data as LeaderboardRow[]) ?? [];
}

/** Mask a phone number for the public display: keep length, hide digits. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\d/g, "•");
}
