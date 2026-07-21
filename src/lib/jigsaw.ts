// Procedural jigsaw geometry.
//
// Invariant: two pieces sharing an edge trace the *identical* curve (one of them
// reversed) so they interlock with no gap or overlap. We guarantee this by
// generating each edge as a canonical list of segments from a canonical start to
// a canonical end, then emitting it forward for one piece and reversed for the
// neighbour.
//
// Units are "cells": a piece cell is 1x1, the board is cols x rows. Tabs bulge
// OUTSIDE the cell by up to ~TAB_DEPTH, so pieces render with a margin.

export const TAB_DEPTH = 0.26; // knob height as a fraction of the cell edge

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

// Deterministic per-edge randomness. kind: 0 = horizontal line, 1 = vertical line.
function edgeRand(seed: number, kind: 0 | 1, i: number, j: number) {
  const r = mulberry32(
    (seed ^ (kind * 0x9e3779b1) ^ (i * 73856093) ^ (j * 19349663)) >>> 0
  );
  return {
    sign: r() < 0.5 ? 1 : -1,
    posJit: (r() - 0.5) * 0.06,
    sizeJit: 1 + (r() - 0.5) * 0.18,
    skew: (r() - 0.5) * 0.05,
  };
}

type Pt = [number, number];
type Seg =
  | { t: "L"; to: Pt }
  | { t: "C"; c1: Pt; c2: Pt; to: Pt };

const f = (p: Pt) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;

// Canonical edge curve from a -> b (length-1 in cell units). Returns the ordered
// segments (implicit start = a). Border edges are a single straight line.
function edgeCurve(
  seed: number,
  kind: 0 | 1,
  i: number,
  j: number,
  a: Pt,
  b: Pt,
  border: boolean
): Seg[] {
  if (border) return [{ t: "L", to: b }];

  const rnd = edgeRand(seed, kind, i, j);
  const along: Pt = [b[0] - a[0], b[1] - a[1]];
  const normal: Pt = [along[1], -along[0]]; // rotate -90deg
  const s = rnd.sign;
  const k = TAB_DEPTH * rnd.sizeJit;
  const c = 0.5 + rnd.posJit;
  const nw = 0.12; // half neck width
  const sh = 0.13; // shoulder length

  const P = (u: number, v: number): Pt => [
    a[0] + along[0] * u + normal[0] * v * s,
    a[1] + along[1] * u + normal[1] * v * s,
  ];

  const p1 = P(c - nw - sh, 0);
  const c1a = P(c - nw, 0);
  const c1b = P(c - nw - rnd.skew, k * 0.55);
  const p2 = P(c - nw, k * 0.72);
  const c2a = P(c - nw * 1.7, k * 1.16);
  const c2b = P(c + nw * 1.7, k * 1.16);
  const p3 = P(c + nw, k * 0.72);
  const c3a = P(c + nw + rnd.skew, k * 0.55);
  const c3b = P(c + nw + sh, 0);
  const p4 = P(c + nw + sh, 0);

  return [
    { t: "L", to: p1 },
    { t: "C", c1: c1a, c2: c1b, to: p2 },
    { t: "C", c1: c2a, c2: c2b, to: p3 },
    { t: "C", c1: c3a, c2: c3b, to: p4 },
    { t: "L", to: b },
  ];
}

// Emit a segment list as SVG path commands, forward or reversed. When reversed,
// traversal runs from the canonical END back to `startForReverse` (the canonical
// start), producing the geometrically identical boundary.
function emit(segs: Seg[], a: Pt, reversed: boolean): string {
  if (!reversed) {
    return segs
      .map((s) => (s.t === "L" ? ` L ${f(s.to)}` : ` C ${f(s.c1)} ${f(s.c2)} ${f(s.to)}`))
      .join("");
  }
  // Reversed: previous anchor for segment i is the `to` of segment i-1 (or a).
  let out = "";
  for (let i = segs.length - 1; i >= 0; i--) {
    const seg = segs[i];
    const prev: Pt = i === 0 ? a : segs[i - 1].to;
    if (seg.t === "L") out += ` L ${f(prev)}`;
    else out += ` C ${f(seg.c2)} ${f(seg.c1)} ${f(prev)}`;
  }
  return out;
}

export interface JigsawEdges {
  rows: number;
  cols: number;
  seed: number;
}

/**
 * Closed SVG path (cell units, cell size = 1) for piece (r, c) with its nominal
 * top-left corner at (ox, oy). Neighbour pieces reuse the same canonical edges.
 */
export function piecePath(
  edges: JigsawEdges,
  r: number,
  c: number,
  ox: number,
  oy: number
): string {
  const { rows, cols, seed } = edges;
  const tl: Pt = [ox, oy];
  const tr: Pt = [ox + 1, oy];
  const br: Pt = [ox + 1, oy + 1];
  const bl: Pt = [ox, oy + 1];

  // Canonical starts: horizontal lines go left->right, vertical lines top->bottom.
  const top = edgeCurve(seed, 0, r, c, tl, tr, r === 0);
  const right = edgeCurve(seed, 1, c + 1, r, tr, br, c === cols - 1);
  const bottomCanonical = edgeCurve(seed, 0, r + 1, c, bl, br, r === rows - 1);
  const leftCanonical = edgeCurve(seed, 1, c, r, tl, bl, c === 0);

  let d = `M ${f(tl)}`;
  d += emit(top, tl, false); // top:   tl -> tr (forward)
  d += emit(right, tr, false); // right: tr -> br (forward)
  d += emit(bottomCanonical, bl, true); // bottom: br -> bl (reverse of bl->br)
  d += emit(leftCanonical, tl, true); // left:   bl -> tl (reverse of tl->bl)
  d += " Z";
  return d;
}

/** Pick a rows x cols grid whose cells are as square as possible for the image. */
export function chooseGrid(
  aspect: number,
  target: number
): { rows: number; cols: number } {
  let best = { rows: 3, cols: 3, err: Infinity };
  for (let rows = 2; rows <= 8; rows++) {
    for (let cols = 2; cols <= 8; cols++) {
      const count = rows * cols;
      const cellAspect = aspect / cols / (1 / rows);
      // Weight the piece-count target a bit more so we reliably land near
      // `target` (medium) instead of collapsing to fewer, perfectly-square cells.
      const err = Math.abs(count - target) * 0.6 + Math.abs(cellAspect - 1) * 6;
      if (err < best.err) best = { rows, cols, err };
    }
  }
  return { rows: best.rows, cols: best.cols };
}
