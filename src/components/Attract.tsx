"use client";

import { useState } from "react";

/**
 * Attract / idle screen. Shows the provided hero image full-bleed with a
 * "Play now" button near the bottom. Drop your real artwork at
 * public/hero.jpg (portrait works best for the big screen).
 *
 * If `onPlay` is omitted (the big-screen mirror), the button is decorative.
 */
export default function Attract({ onPlay }: { onPlay?: () => void }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center opacity-80">
            <div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-3xl bg-accent/15 text-6xl">
              🧩
            </div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent/80">
              Drop your artwork at
            </p>
            <p className="mt-1 font-mono text-xs text-white/50">public/hero.jpg</p>
          </div>
        </div>
      )}

      {/* Legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-[6vmin] text-center">
        <div className="float-up">
          <p className="text-[clamp(0.7rem,1.6vmin,1.1rem)] uppercase tracking-[0.4em] text-accent">
            Celogen
          </p>
          <h1 className="mt-2 text-[clamp(1.8rem,6vmin,5rem)] font-black leading-[0.95] tracking-tight drop-shadow-lg">
            JIGSAW
            <br />
            CHALLENGE
          </h1>
        </div>

        <div className="mb-[2vmin] flex flex-col items-center gap-[2vmin]">
          <p className="max-w-[28ch] text-[clamp(0.8rem,2vmin,1.3rem)] text-white/80">
            Snap the pieces together as fast as you can and top the leaderboard.
          </p>
          <button
            type="button"
            onClick={onPlay}
            className={`pulse-glow rounded-full bg-accent px-[8vmin] py-[2.2vmin] text-[clamp(1rem,2.6vmin,1.8rem)] font-extrabold text-black transition ${
              onPlay ? "cursor-pointer hover:bg-emerald-300 active:scale-95" : "cursor-default"
            }`}
          >
            ▶ Play now
          </button>
        </div>
      </div>
    </div>
  );
}
