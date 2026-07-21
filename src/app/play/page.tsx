"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Attract from "@/components/Attract";
import PuzzleBoard from "@/components/PuzzleBoard";
import Leaderboard from "@/components/Leaderboard";
import { driver, getDeviceId, useGameState, useLiveSender } from "@/lib/sync";
import { formatTime, progress } from "@/lib/puzzle";
import { fetchTop, submitScore, markRegistrationSolved } from "@/lib/leaderboard";
import { LeaderboardRow, PiecePos } from "@/lib/types";

const RESULT_SECONDS = 10;

export default function PlayPage() {
  const { state, loaded } = useGameState();
  const [deviceId, setDeviceId] = useState<string>("");
  const liveSend = useLiveSender();

  useEffect(() => setDeviceId(getDeviceId()), []);

  const isDriver = !!deviceId && state?.driver_device_id === deviceId;
  const status = state?.status ?? "idle";
  const step = !loaded || !isDriver || status === "idle" ? "attract" : status;

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slmc, setSlmc] = useState("");
  const [error, setError] = useState<string | null>(null);

  // live piece + timer plumbing
  const piecesRef = useRef<PiecePos[]>([]);
  const startedAtMs = state?.started_at ? new Date(state.started_at).getTime() : null;
  const [nowTick, setNowTick] = useState(0);

  // results
  const [result, setResult] = useState<{ rank: number; id: number | null } | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [countdown, setCountdown] = useState(RESULT_SECONDS);

  const elapsed = useCallback(
    () => (startedAtMs ? Date.now() - startedAtMs : 0),
    [startedAtMs]
  );

  const sendLive = useCallback(
    (pieces: PiecePos[]) => {
      liveSend({ positions: pieces, elapsedMs: elapsed() });
    },
    [liveSend, elapsed]
  );

  // ---- step handlers ------------------------------------------------------

  const onPlayNow = async () => {
    setName("");
    setPhone("");
    setSlmc("");
    setResult(null);
    await driver.beginCapture(deviceId);
  };

  // Capture the player's details, then hand off to the display, which adds the
  // puzzle image. The controller just waits until the puzzle is ready.
  const onSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 6) {
      setError("Enter a name and a valid phone number.");
      return;
    }
    if (slmc.trim().length < 3) {
      setError("Enter your SLMC number.");
      return;
    }
    setError(null);
    await driver.setPlayer(name.trim(), phone.trim(), slmc.trim());
  };

  // Timer starts the moment the player grabs their first piece.
  const onFirstInteract = useCallback(() => {
    driver.startTimer();
  }, []);

  const solvedRef = useRef(false);
  const onSolved = useCallback(
    async (pieces: PiecePos[]) => {
      if (solvedRef.current) return;
      solvedRef.current = true;
      const timeMs = elapsed();
      sendLive(pieces);
      await driver.finish(timeMs, pieces);
      if (state?.registration_id) {
        await markRegistrationSolved(state.registration_id, timeMs);
      }
      const r = await submitScore(
        state?.player_name ?? name,
        state?.player_phone ?? phone,
        state?.player_slmc ?? slmc,
        timeMs
      );
      setResult(r);
      setBoard(await fetchTop(6));
    },
    [
      elapsed,
      sendLive,
      state?.player_name,
      state?.player_phone,
      state?.player_slmc,
      state?.registration_id,
      name,
      phone,
      slmc,
    ]
  );

  // reset the solved flag whenever a new round begins
  useEffect(() => {
    if (status !== "solved") solvedRef.current = false;
  }, [status, state?.started_at]);

  // live clock while playing
  useEffect(() => {
    if (step !== "playing") return;
    const id = setInterval(() => setNowTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [step]);

  // periodic broadcast so the display timer keeps moving even when idle
  useEffect(() => {
    if (step !== "playing") return;
    const id = setInterval(() => sendLive(piecesRef.current), 250);
    return () => clearInterval(id);
  }, [step, sendLive]);

  // results countdown -> back to idle (driver owns this)
  useEffect(() => {
    if (step !== "solved" || !isDriver) return;
    setCountdown(RESULT_SECONDS);
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const done = setTimeout(() => driver.resetIdle(), RESULT_SECONDS * 1000 + 400);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [step, isDriver, state?.solved_at]);

  const config = state?.puzzle_config;
  const initialPieces = state?.pieces_placed ?? [];
  const pct = Math.round(progress(piecesRef.current) * 100);

  // ---- render -------------------------------------------------------------

  return (
    <main className="kiosk relative h-dvh w-full">
      {step === "attract" && <Attract onPlay={onPlayNow} />}

      {step === "capturing" && (
        <Centered>
          <form onSubmit={onSubmitDetails} className="float-up w-full max-w-md">
            <h2 className="mb-1 text-3xl font-black">Your details</h2>
            <p className="mb-6 text-slate-500">So we can shout out the winner.</p>

            <label className="mb-1 block text-sm font-semibold text-slate-600">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mb-4 w-full rounded-xl bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-accent"
            />

            <label className="mb-1 block text-sm font-semibold text-slate-600">
              Phone number <span className="text-slate-400">(hidden on the big screen)</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="07X XXX XXXX"
              className="mb-4 w-full rounded-xl bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-accent"
            />

            <label className="mb-1 block text-sm font-semibold text-slate-600">
              SLMC Number
            </label>
            <input
              value={slmc}
              onChange={(e) => setSlmc(e.target.value)}
              placeholder="e.g. 12345"
              className="mb-6 w-full rounded-xl bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-accent"
            />

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-accent py-3 text-lg font-extrabold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              Continue →
            </button>
          </form>
        </Centered>
      )}

      {step === "uploading" && (
        <Centered>
          <div className="float-up text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-accent" />
            <h2 className="text-3xl font-black">You&apos;re in, {state?.player_name || "player"}!</h2>
            <p className="mt-2 text-slate-500">Adding your picture — get ready to solve.</p>
          </div>
        </Centered>
      )}

      {step === "playing" && config && (
        <div className="flex h-full w-full flex-col">
          <TopBar
            name={state?.player_name || "Player"}
            time={formatTime(elapsed())}
            pct={pct}
            started={!!startedAtMs}
          />
          <div className="min-h-0 flex-1">
            <PuzzleBoard
              config={config}
              mode="play"
              initialPieces={initialPieces}
              onFirstInteract={onFirstInteract}
              onLive={(p) => {
                piecesRef.current = p;
                sendLive(p);
              }}
              onCommit={(p) => {
                piecesRef.current = p;
                driver.snapshot(p);
              }}
              onSolved={onSolved}
            />
          </div>
        </div>
      )}

      {step === "solved" && (
        <Centered>
          <div className="float-up w-full max-w-lg text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-2 text-4xl font-black">Solved!</h2>
            <p className="mt-1 text-slate-600">
              {state?.player_name}, your time
            </p>
            <p className="my-3 font-mono text-6xl font-black text-accent">
              {formatTime(state?.time_ms ?? 0)}
            </p>
            {result && (
              <p className="mb-6 text-xl font-bold">
                You placed <span className="text-accent">#{result.rank}</span>
              </p>
            )}
            <Leaderboard rows={board} highlightId={result?.id} />
            <p className="mt-6 text-sm text-slate-400">
              Back to start in {Math.max(0, countdown)}s…
            </p>
          </div>
        </Centered>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">{children}</div>
  );
}

function TopBar({
  name,
  time,
  pct,
  started,
}: {
  name: string;
  time: string;
  pct: number;
  started: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold">{name}</p>
        <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="rounded-xl bg-white px-4 py-1.5 font-mono text-2xl font-black tabular-nums text-accent shadow-sm ring-1 ring-slate-200">
        {started ? time : "0:00.00"}
      </div>
    </div>
  );
}
