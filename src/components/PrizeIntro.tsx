"use client";

// Controller ("tab") attract screen: "PUZZLE TO PRIZE" with a Play button,
// on a white background scattered with faint puzzle pieces.

const PIECE_PATH =
  "M20,20 L44,20 A8,8 0 1 1 60,20 L80,20 L80,44 A8,8 0 1 1 80,60 L80,80 L20,80 Z";

// Decorative pieces: left%, top%, size(vmin), rotation(deg), opacity.
const PIECES: Array<[number, number, number, number, number]> = [
  [-3, -5, 16, 20, 0.5],
  [13, 7, 9, -12, 0.4],
  [31, -4, 11, 35, 0.45],
  [55, 3, 10, -25, 0.4],
  [78, -6, 15, 15, 0.5],
  [90, 13, 12, 60, 0.4],
  [-4, 31, 13, -30, 0.45],
  [88, 40, 10, 20, 0.4],
  [-2, 60, 14, 40, 0.5],
  [92, 66, 13, -15, 0.45],
  [10, 83, 11, 25, 0.45],
  [36, 91, 10, -35, 0.4],
  [61, 88, 12, 15, 0.45],
  [82, 84, 14, -20, 0.5],
];

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
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {PIECES.map(([l, t, s, r, o], i) => (
          <svg
            key={i}
            x={`${l}%`}
            y={`${t}%`}
            width={`${s}vmin`}
            height={`${s}vmin`}
            viewBox="0 0 100 100"
            style={{ overflow: "visible" }}
          >
            <path
              d={PIECE_PATH}
              fill="#7ac47f"
              opacity={o}
              transform={`rotate(${r} 50 50)`}
            />
          </svg>
        ))}
      </svg>

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
