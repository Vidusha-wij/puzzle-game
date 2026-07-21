"use client";

import { LeaderboardRow } from "@/lib/types";
import { formatTime } from "@/lib/puzzle";

const medal = ["🥇", "🥈", "🥉"];

export default function Leaderboard({
  rows,
  highlightId,
  compact,
}: {
  rows: LeaderboardRow[];
  highlightId?: number | null;
  compact?: boolean;
}) {
  return (
    <div className="w-full">
      <ol className="flex flex-col gap-[1.2vmin]">
        {rows.map((row, i) => {
          const isMe = highlightId != null && row.id === highlightId;
          return (
            <li
              key={row.id}
              className={`flex items-center gap-[2vmin] rounded-2xl px-[3vmin] py-[1.6vmin] ${
                isMe
                  ? "bg-accent text-white ring-2 ring-accent/40"
                  : "bg-white shadow-sm ring-1 ring-slate-200"
              }`}
            >
              <span
                className={`w-[3ch] text-center text-[clamp(1rem,2.4vmin,1.8rem)] font-black ${
                  isMe ? "text-white" : "text-accent"
                }`}
              >
                {medal[i] ?? i + 1}
              </span>
              <span className="flex-1 truncate text-[clamp(1rem,2.6vmin,2rem)] font-bold">
                {row.name}
              </span>
              <span
                className={`font-mono text-[clamp(1rem,2.6vmin,2rem)] font-bold ${
                  isMe ? "text-white" : "text-slate-900"
                }`}
              >
                {formatTime(row.time_ms)}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-2xl bg-white px-[3vmin] py-[2vmin] text-center text-slate-400 ring-1 ring-slate-200">
            No scores yet — be the first!
          </li>
        )}
      </ol>
      {!compact && rows.length > 0 && (
        <p className="mt-[2vmin] text-center text-[clamp(0.7rem,1.6vmin,1rem)] uppercase tracking-[0.3em] text-slate-400">
          Fastest solves
        </p>
      )}
    </div>
  );
}
