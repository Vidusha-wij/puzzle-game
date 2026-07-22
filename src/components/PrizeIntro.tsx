"use client";

/* eslint-disable @next/next/no-img-element */

// Controller ("tab") attract screen — same branded artwork as the main
// display (green background, puzzle-piece pattern, "Puzzle to Prize" title)
// plus the Play Now button that starts a round.

export default function PrizeIntro({ onPlay }: { onPlay?: () => void }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#1c4524]">
      <img
        src="/display/background.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src="/display/pattern.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex flex-col items-center gap-[7vmin] px-[6vmin] text-center">
        <img
          src="/display/puzzle-to-prize.svg"
          alt="Puzzle to Prize"
          className="w-[78%] max-w-[90vmin] object-contain drop-shadow-[0_1vmin_2vmin_rgba(0,0,0,0.35)]"
        />

        <button
          type="button"
          onClick={onPlay}
          className="pulse-glow-light cursor-pointer rounded-full bg-white px-[11vmin] py-[3vmin] text-[clamp(1.1rem,3.6vmin,2.2rem)] font-black uppercase tracking-wider text-[#1c4524] shadow-[0_1vmin_3vmin_rgba(0,0,0,0.35)] transition hover:brightness-95 active:scale-95"
        >
          Play Now
        </button>
      </div>
    </div>
  );
}
