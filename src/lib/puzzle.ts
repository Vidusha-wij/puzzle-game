import { PiecePos, PuzzleConfig } from "./types";

/** Home position (normalized to board rect) of piece `id`. */
export function home(id: number, rows: number, cols: number) {
  const c = id % cols;
  const r = Math.floor(id / cols);
  return { x: c / cols, y: r / rows };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scatter all pieces into the tray band below the board (normalized coords). */
export function makeInitialPieces(config: PuzzleConfig): PiecePos[] {
  const { rows, cols, seed } = config;
  const n = rows * cols;
  const rnd = mulberry32(seed + 12345);

  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const trayCols = cols + 1;
  const trayRows = Math.ceil(n / trayCols);
  const rowGap = Math.min(0.3, 0.62 / Math.max(1, trayRows - 1));

  return ids.map((id, k) => {
    const col = k % trayCols;
    const row = Math.floor(k / trayCols);
    const x =
      0.03 + (col / Math.max(1, trayCols - 1)) * 0.92 + (rnd() - 0.5) * 0.03;
    const y = 1.14 + row * rowGap + (rnd() - 0.5) * 0.04;
    return { id, x, y, placed: false };
  });
}

/**
 * The normalized extent (in board-rect units) that the board + scattered tray
 * occupy, so the layout can be sized to always fit. Mirrors makeInitialPieces.
 * The board itself spans [0,1]x[0,1]; the tray extends below and slightly past
 * the right edge.
 */
export function scatterExtent(rows: number, cols: number): { xMax: number; yMax: number } {
  const n = rows * cols;
  const trayCols = cols + 1;
  const trayRows = Math.ceil(n / trayCols);
  const rowGap = Math.min(0.3, 0.62 / Math.max(1, trayRows - 1));
  // rightmost piece: nominal left ~0.965 + one cell width; jitter included.
  const xMax = Math.max(1, 0.965 + 1 / cols);
  // lowest piece: top of last tray row + one cell height; jitter included.
  const yMax = Math.max(1, 1.14 + (trayRows - 1) * rowGap + 0.02 + 1 / rows);
  return { xMax, yMax };
}

/** Are all pieces locked into place? */
export function isSolved(pieces: PiecePos[]): boolean {
  return pieces.length > 0 && pieces.every((p) => p.placed);
}

export function progress(pieces: PiecePos[]): number {
  if (pieces.length === 0) return 0;
  return pieces.filter((p) => p.placed).length / pieces.length;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, "0")}.${cs
    .toString()
    .padStart(2, "0")}`;
}
