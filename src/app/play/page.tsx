"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Attract from "@/components/Attract";
import PuzzleBoard from "@/components/PuzzleBoard";
import Leaderboard from "@/components/Leaderboard";
import { supabase, PHOTO_BUCKET } from "@/lib/supabase";
import { driver, getDeviceId, useGameState, useLiveSender } from "@/lib/sync";
import { chooseGrid } from "@/lib/jigsaw";
import { makeInitialPieces, formatTime, progress } from "@/lib/puzzle";
import { fetchTop, submitScore } from "@/lib/leaderboard";
import { LeaderboardRow, PiecePos, PuzzleConfig } from "@/lib/types";

const DIFFICULTIES = [
  { key: "easy", label: "Easy", count: 6 },
  { key: "medium", label: "Medium", count: 12 },
  { key: "hard", label: "Hard", count: 20 },
] as const;

const RESULT_SECONDS = 10;

function imageAspect(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth / Math.max(1, img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(1);
    };
    img.src = url;
  });
}

export default function PlayPage() {
  const { state, loaded } = useGameState();
  const [deviceId, setDeviceId] = useState<string>("");
  const liveSend = useLiveSender();

  useEffect(() => setDeviceId(getDeviceId()), []);

  const isDriver = !!deviceId && state?.driver_device_id === deviceId;
  const status = state?.status ?? "idle";
  const step = !loaded || !isDriver || status === "idle" ? "attract" : status;

  // form + upload state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>(
    DIFFICULTIES[1]
  );
  const [busy, setBusy] = useState(false);
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
    setResult(null);
    await driver.beginCapture(deviceId);
  };

  const onSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 6) {
      setError("Enter a name and a valid phone number.");
      return;
    }
    setError(null);
    await driver.setPlayer(name.trim(), phone.trim());
  };

  const onPickImage = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const aspect = await imageAspect(file);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

      const { rows, cols } = chooseGrid(aspect, difficulty.count);
      const config: PuzzleConfig = {
        rows,
        cols,
        aspect,
        imageUrl: data.publicUrl,
        seed: Math.floor(Math.random() * 1_000_000_000),
      };
      const initial = makeInitialPieces(config);
      piecesRef.current = initial;
      await driver.startPlay(config, initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const solvedRef = useRef(false);
  const onSolved = useCallback(
    async (pieces: PiecePos[]) => {
      if (solvedRef.current) return;
      solvedRef.current = true;
      const timeMs = elapsed();
      sendLive(pieces);
      await driver.finish(timeMs, pieces);
      const r = await submitScore(state?.player_name ?? name, state?.player_phone ?? phone, timeMs);
      setResult(r);
      setBoard(await fetchTop(6));
    },
    [elapsed, sendLive, state?.player_name, state?.player_phone, name, phone]
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
            <p className="mb-6 text-white/60">So we can shout out the winner.</p>

            <label className="mb-1 block text-sm font-semibold text-white/70">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mb-4 w-full rounded-xl bg-white/5 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-accent"
            />

            <label className="mb-1 block text-sm font-semibold text-white/70">
              Phone number <span className="text-white/40">(hidden on the big screen)</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="07X XXX XXXX"
              className="mb-6 w-full rounded-xl bg-white/5 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-accent"
            />

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-accent py-3 text-lg font-extrabold text-black transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              Continue →
            </button>
          </form>
        </Centered>
      )}

      {step === "uploading" && (
        <Centered>
          <div className="float-up w-full max-w-md text-center">
            <h2 className="mb-1 text-3xl font-black">Choose your picture</h2>
            <p className="mb-6 text-white/60">
              Hi {state?.player_name || "there"} — pick a photo to turn into a puzzle.
            </p>

            <div className="mb-6 flex justify-center gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ring-1 transition ${
                    difficulty.key === d.key
                      ? "bg-accent text-black ring-accent"
                      : "bg-white/5 text-white/70 ring-white/15 hover:ring-white/30"
                  }`}
                >
                  {d.label}
                  <span className="ml-1 opacity-60">{d.count}</span>
                </button>
              ))}
            </div>

            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] px-6 py-12 transition hover:border-accent/60 hover:bg-white/[0.06]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickImage(f);
                }}
              />
              <div className="text-5xl">📷</div>
              <p className="mt-3 text-lg font-semibold">
                {busy ? "Preparing puzzle…" : "Tap to upload a photo"}
              </p>
              <p className="mt-1 text-sm text-white/40">JPG or PNG</p>
            </label>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </div>
        </Centered>
      )}

      {step === "playing" && config && (
        <div className="flex h-full w-full flex-col">
          <TopBar
            name={state?.player_name || "Player"}
            time={formatTime(elapsed())}
            pct={pct}
          />
          <div className="min-h-0 flex-1">
            <PuzzleBoard
              config={config}
              mode="play"
              initialPieces={initialPieces}
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
            <p className="mt-1 text-white/70">
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
            <p className="mt-6 text-sm text-white/40">
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

function TopBar({ name, time, pct }: { name: string; time: string; pct: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold">{name}</p>
        <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="rounded-xl bg-white/5 px-4 py-1.5 font-mono text-2xl font-black tabular-nums text-accent ring-1 ring-white/10">
        {time}
      </div>
    </div>
  );
}
