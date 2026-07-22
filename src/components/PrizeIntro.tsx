"use client";

// Controller ("tab") attract screen: "PUZZLE TO PRIZE" with a Play button,
// on a white background scattered with faint puzzle pieces.

import PuzzleScatter from "./PuzzleScatter";

function Word({ children, className }: { children: string; className: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 translate-y-[0.06em] text-emerald-800/60" aria-hidden>
        {children}
      </span>
      <span className="relative bg-gradient-to-b from-emerald-400 to-emerald-700 bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  );
}

export default function PrizeIntro({ onPlay }: { onPlay?: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white">
      {/* faint scattered puzzle pieces */}
      <PuzzleScatter fill="#7ac47f" />

      {/* Title + button */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <h1 className="font-black uppercase leading-[0.82] tracking-tight drop-shadow-[0_2px_1px_rgba(20,80,40,0.25)]">
          <Word className="text-[clamp(2.4rem,11vw,6rem)]">Puzzle</Word>
          <span className="block">
            <Word className="text-[clamp(2rem,8vw,4.5rem)]">To</Word>
          </span>
          <Word className="text-[clamp(4rem,20vw,11rem)]">Prize</Word>
        </h1>

        <button
          type="button"
          onClick={onPlay}
          className="pulse-glow mt-[6vmin] cursor-pointer rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 px-[10vmin] py-[2.4vmin] text-[clamp(1rem,3vmin,1.8rem)] font-extrabold uppercase tracking-wider text-white shadow-[0_10px_24px_rgba(16,122,80,0.4)] ring-1 ring-emerald-800/20 transition hover:brightness-110 active:scale-95"
        >
          Play Now
        </button>
      </div>
    </div>
  );
}
