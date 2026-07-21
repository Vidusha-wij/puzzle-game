"use client";

/* eslint-disable @next/next/no-img-element */
import { PRESET_IMAGES } from "@/lib/images";

// One image on screen per SLOT seconds; the whole loop is SLOT * count.
const SLOT = 4.5;
const TOTAL = SLOT * PRESET_IMAGES.length;

/**
 * Attract / idle screen. Crossfades through the preset images with a pure-CSS
 * animation so the big screen keeps switching without relying on JS timers.
 *
 * - Big screen (no `onPlay`): images only.
 * - Controller (`onPlay` set): images dimmed, with the "Play now" button.
 */
export default function Attract({ onPlay }: { onPlay?: () => void }) {
  const isController = !!onPlay;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {PRESET_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            animation: `slideFade ${TOTAL}s linear infinite`,
            animationDelay: `${-SLOT * i}s`,
          }}
        />
      ))}

      {isController && (
        <>
          {/* Legibility gradient + call to action, controller only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-between p-[6vmin] text-center">
            <div className="float-up">
              <p className="text-[clamp(0.7rem,1.6vmin,1.1rem)] uppercase tracking-[0.4em] text-accent">
                Celogen
              </p>
              <h1 className="mt-2 text-[clamp(1.8rem,6vmin,5rem)] font-black leading-[0.95] tracking-tight text-white drop-shadow-lg">
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
                className="pulse-glow cursor-pointer rounded-full bg-accent px-[8vmin] py-[2.2vmin] text-[clamp(1rem,2.6vmin,1.8rem)] font-extrabold text-white transition hover:brightness-110 active:scale-95"
              >
                ▶ Play now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
