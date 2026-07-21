"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { PRESET_IMAGES } from "@/lib/images";

const INTERVAL_MS = 45000; // switch every 45 seconds
const FADE_MS = 1500; // crossfade duration

/**
 * Attract / idle screen. Shows the preset images, switching to a *random*
 * different one every 45s with a smooth crossfade.
 *
 * - Big screen (no `onPlay`): images only.
 * - Controller (`onPlay` set): images dimmed, with the "Play now" button.
 */
export default function Attract({ onPlay }: { onPlay?: () => void }) {
  // Start at 0 for SSR + first client render (no hydration mismatch), then
  // randomise the start and rotate on the client.
  const [idx, setIdx] = useState(0);
  const isController = !!onPlay;

  useEffect(() => {
    if (PRESET_IMAGES.length < 2) return;
    setIdx(Math.floor(Math.random() * PRESET_IMAGES.length));
    const id = setInterval(() => {
      setIdx((cur) => {
        let next = cur;
        while (next === cur) next = Math.floor(Math.random() * PRESET_IMAGES.length);
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {PRESET_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
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
