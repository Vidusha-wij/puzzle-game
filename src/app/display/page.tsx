"use client";

import { useEffect, useRef, useState } from "react";
import PrizeDisplay from "@/components/PrizeDisplay";
import PuzzleBoard from "@/components/PuzzleBoard";
import Leaderboard from "@/components/Leaderboard";
import { useGameState, useLiveReceiver } from "@/lib/sync";
import { fetchTop, maskPhone } from "@/lib/leaderboard";
import { formatTime, progress } from "@/lib/puzzle";
import { LeaderboardRow, PiecePos } from "@/lib/types";

export default function DisplayPage() {
  const { state } = useGameState();
  const status = state?.status ?? "idle";

  // live mirror positions + timer
  const [positions, setPositions] = useState<PiecePos[]>([]);
  const elapsedRef = useRef({ base: 0, at: 0 });
  const [clock, setClock] = useState(0);

  useLiveReceiver((p) => {
    setPositions(p.positions);
    elapsedRef.current = { base: p.elapsedMs, at: Date.now() };
  });

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      const { base, at } = elapsedRef.current;
      setClock(base > 0 ? base + (Date.now() - at) : 0);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "idle" || status === "capturing") {
      setPositions([]);
      elapsedRef.current = { base: 0, at: 0 };
      setClock(0);
    }
  }, [status]);

  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  useEffect(() => {
    if (status === "solved") fetchTop(6).then(setBoard);
  }, [status, state?.solved_at]);

  const config = state?.puzzle_config;
  const mirrorPieces = positions.length ? positions : state?.pieces_placed ?? [];
  const pct = Math.round(progress(mirrorPieces) * 100);

  return (
    <main className="kiosk relative h-dvh w-full">
      {/* Idle + capturing: the branded "Puzzle to Prize" screen with rotating products. */}
      {(status === "idle" || status === "capturing") && <PrizeDisplay />}

      {status === "uploading" && (
        <div className="flex h-full w-full flex-col items-center justify-center p-[6vmin] text-center">
          <div className="float-up">
            <div className="text-[14vmin] leading-none">📷</div>
            <h2 className="mt-[3vmin] text-[7vmin] font-black leading-none">
              {state?.player_name ? `${state.player_name} is up!` : "Almost there…"}
            </h2>
            <p className="mt-[2vmin] text-[3vmin] text-slate-500">
              Choosing a picture to solve…
            </p>
          </div>
        </div>
      )}

      {status === "playing" && config && (
        <div className="flex h-full w-full flex-col">
          <DisplayBar
            name={state?.player_name || "Player"}
            phone={maskPhone(state?.player_phone)}
            time={formatTime(clock)}
            pct={pct}
          />
          <div className="min-h-0 flex-1">
            <PuzzleBoard config={config} mode="mirror" pieces={mirrorPieces} />
          </div>
        </div>
      )}

      {status === "solved" && (
        <div className="flex h-full w-full flex-col items-center justify-center p-[6vmin] text-center">
          <div className="float-up w-full max-w-[80vmin]">
            <div className="text-[10vmin] leading-none">🎉</div>
            <h2 className="mt-[2vmin] text-[7vmin] font-black leading-none">Solved!</h2>
            <p className="mt-[2vmin] text-[3vmin] text-slate-600">{state?.player_name}</p>
            <p className="my-[2vmin] font-mono text-[11vmin] font-black leading-none text-accent">
              {formatTime(state?.time_ms ?? 0)}
            </p>
            <div className="mt-[3vmin]">
              <Leaderboard rows={board} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DisplayBar({
  name,
  phone,
  time,
  pct,
}: {
  name: string;
  phone: string;
  time: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-[3vmin] px-[4vmin] py-[2.5vmin]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[4vmin] font-black leading-none">{name}</p>
        {phone && (
          <p className="mt-[0.6vmin] font-mono text-[2.2vmin] tracking-widest text-slate-400">
            {phone}
          </p>
        )}
        <div className="mt-[1.4vmin] h-[1.2vmin] w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="rounded-2xl bg-white px-[3vmin] py-[1.4vmin] font-mono text-[5vmin] font-black tabular-nums text-accent shadow-sm ring-1 ring-slate-200">
        {time}
      </div>
    </div>
  );
}
