"use client";

// Dev-only harness to visually verify the jigsaw board without Supabase.
// Not linked from the app. Safe to delete.

import { useMemo, useState } from "react";
import PuzzleBoard from "@/components/PuzzleBoard";
import { chooseGrid } from "@/lib/jigsaw";
import { makeInitialPieces } from "@/lib/puzzle";
import { PuzzleConfig } from "@/lib/types";

export default function PreviewPage() {
  const aspect = 1.5;
  const { rows, cols } = chooseGrid(aspect, 12);
  const config: PuzzleConfig = useMemo(
    () => ({
      rows,
      cols,
      aspect,
      seed: 42,
      imageUrl: "https://picsum.photos/seed/celogen/960/640",
    }),
    [rows, cols]
  );
  const initial = useMemo(() => makeInitialPieces(config), [config]);
  const [solved, setSolved] = useState(false);

  return (
    <main className="h-dvh w-full">
      <div className="p-2 text-center text-sm text-white/60">
        preview harness — {rows}×{cols} — {solved ? "SOLVED 🎉" : "drag pieces to solve"}
      </div>
      <div className="h-[calc(100%-2rem)]">
        <PuzzleBoard
          config={config}
          mode="play"
          initialPieces={initial}
          onSolved={() => setSolved(true)}
        />
      </div>
    </main>
  );
}
