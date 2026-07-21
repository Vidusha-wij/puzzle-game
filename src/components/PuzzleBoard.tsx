"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { JigsawEdges, piecePath, TAB_DEPTH } from "@/lib/jigsaw";
import { home, isSolved } from "@/lib/puzzle";
import { PiecePos, PuzzleConfig } from "@/lib/types";

interface Size {
  w: number;
  h: number;
}

interface BoardLayout {
  originX: number;
  originY: number;
  boardW: number;
  boardH: number;
  cellW: number;
  cellH: number;
}

const SNAP_NORM = 0.05; // snap distance as a fraction of the board
const MARGIN_CELLS = TAB_DEPTH * 1.12; // extra room around each cell for knobs

function computeLayout(size: Size, aspect: number, cols: number, rows: number): BoardLayout {
  const boardMaxW = size.w * 0.92;
  const boardMaxH = size.h * 0.52;
  let boardW = Math.min(boardMaxW, boardMaxH * aspect);
  let boardH = boardW / aspect;
  if (boardH > boardMaxH) {
    boardH = boardMaxH;
    boardW = boardH * aspect;
  }
  const originX = (size.w - boardW) / 2;
  const originY = size.h * 0.05;
  return {
    originX,
    originY,
    boardW,
    boardH,
    cellW: boardW / cols,
    cellH: boardH / rows,
  };
}

export interface PuzzleBoardProps {
  config: PuzzleConfig;
  mode: "play" | "mirror";
  /** play: starting scatter. */
  initialPieces?: PiecePos[];
  /** mirror: live positions from the driver. */
  pieces?: PiecePos[];
  onLive?: (pieces: PiecePos[]) => void;
  onCommit?: (pieces: PiecePos[]) => void;
  onSolved?: (pieces: PiecePos[]) => void;
  /** Fired once, when the player grabs the very first piece (starts the clock). */
  onFirstInteract?: () => void;
}

export default function PuzzleBoard({
  config,
  mode,
  initialPieces,
  pieces: mirrorPieces,
  onLive,
  onCommit,
  onSolved,
  onFirstInteract,
}: PuzzleBoardProps) {
  const { rows, cols, imageUrl, aspect } = config;
  const edges: JigsawEdges = useMemo(
    () => ({ rows, cols, seed: config.seed }),
    [rows, cols, config.seed]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Measure immediately so we don't depend on the ResizeObserver's first
    // callback (which some environments defer until the next paint).
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.w === rect.width && prev.h === rect.height
          ? prev
          : { w: rect.width, h: rect.height }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const layout = useMemo(
    () => (size.w > 0 ? computeLayout(size, aspect, cols, rows) : null),
    [size, aspect, cols, rows]
  );

  // --- interactive state (play mode) ---------------------------------------
  const [localPieces, setLocalPieces] = useState<PiecePos[]>(initialPieces ?? []);
  const draggingRef = useRef<{
    id: number;
    offX: number; // pointer offset from piece nominal top-left, in normalized board units
    offY: number;
  } | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const liveRaf = useRef<number | null>(null);
  const interactedRef = useRef(false);

  // Reset when a new round starts (config seed / initial scatter changes).
  useEffect(() => {
    if (mode === "play" && initialPieces) setLocalPieces(initialPieces);
    interactedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.seed, mode]);

  const pieces = mode === "play" ? localPieces : mirrorPieces ?? [];

  const scheduleLive = useCallback(
    (next: PiecePos[]) => {
      if (!onLive) return;
      if (liveRaf.current != null) return;
      liveRaf.current = requestAnimationFrame(() => {
        liveRaf.current = null;
        onLive(next);
      });
    },
    [onLive]
  );

  const pointerToNorm = useCallback(
    (clientX: number, clientY: number) => {
      if (!layout) return { x: 0, y: 0 };
      const rect = containerRef.current!.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      return {
        x: (px - layout.originX) / layout.boardW,
        y: (py - layout.originY) / layout.boardH,
      };
    },
    [layout]
  );

  const onPointerDownPiece = useCallback(
    (e: React.PointerEvent, p: PiecePos) => {
      if (mode !== "play" || p.placed || !layout) return;
      e.preventDefault();
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* pointer id may not be active (e.g. synthetic events) */
      }
      const n = pointerToNorm(e.clientX, e.clientY);
      draggingRef.current = { id: p.id, offX: n.x - p.x, offY: n.y - p.y };
      setDragId(p.id);
      if (!interactedRef.current) {
        interactedRef.current = true;
        onFirstInteract?.();
      }
    },
    [mode, layout, pointerToNorm, onFirstInteract]
  );

  useEffect(() => {
    if (mode !== "play") return;

    const move = (e: PointerEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const n = pointerToNorm(e.clientX, e.clientY);
      setLocalPieces((prev) => {
        const next = prev.map((p) =>
          p.id === d.id ? { ...p, x: n.x - d.offX, y: n.y - d.offY } : p
        );
        scheduleLive(next);
        return next;
      });
    };

    const up = () => {
      const d = draggingRef.current;
      if (!d) return;
      draggingRef.current = null;
      setDragId(null);
      setLocalPieces((prev) => {
        const h = home(d.id, rows, cols);
        const next = prev.map((p) => {
          if (p.id !== d.id) return p;
          const dist = Math.hypot(p.x - h.x, p.y - h.y);
          if (dist < SNAP_NORM) return { ...p, x: h.x, y: h.y, placed: true };
          return p;
        });
        onLive?.(next);
        onCommit?.(next);
        if (isSolved(next)) onSolved?.(next);
        return next;
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [mode, rows, cols, pointerToNorm, scheduleLive, onLive, onCommit, onSolved]);

  // Render order: placed first (behind), then unplaced, dragged one last.
  const ordered = useMemo(() => {
    const arr = [...pieces];
    arr.sort((a, b) => {
      if (a.placed !== b.placed) return a.placed ? -1 : 1;
      if (a.id === dragId) return 1;
      if (b.id === dragId) return -1;
      return 0;
    });
    return arr;
  }, [pieces, dragId]);

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none select-none">
      {layout && (
        <>
          {/* Board frame / ghost of the finished image */}
          <div
            className="absolute rounded-md ring-1 ring-black/10"
            style={{
              left: layout.originX,
              top: layout.originY,
              width: layout.boardW,
              height: layout.boardH,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
              background:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0 10px, rgba(0,0,0,0.04) 10px 20px)",
            }}
          >
            <img
              src={imageUrl}
              alt=""
              className="pointer-events-none h-full w-full rounded-md object-fill opacity-[0.12]"
            />
            {/* cell grid guide */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${cols} ${rows}`}
              preserveAspectRatio="none"
            >
              {Array.from({ length: cols - 1 }, (_, i) => (
                <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={rows} stroke="rgba(0,0,0,0.08)" strokeWidth={0.01} />
              ))}
              {Array.from({ length: rows - 1 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i + 1} x2={cols} y2={i + 1} stroke="rgba(0,0,0,0.08)" strokeWidth={0.01} />
              ))}
            </svg>
          </div>

          {ordered.map((p) => (
            <Piece
              key={p.id}
              p={p}
              edges={edges}
              rows={rows}
              cols={cols}
              imageUrl={imageUrl}
              layout={layout}
              interactive={mode === "play"}
              dragging={p.id === dragId}
              onPointerDown={onPointerDownPiece}
            />
          ))}
        </>
      )}
    </div>
  );
}

function Piece({
  p,
  edges,
  rows,
  cols,
  imageUrl,
  layout,
  interactive,
  dragging,
  onPointerDown,
}: {
  p: PiecePos;
  edges: JigsawEdges;
  rows: number;
  cols: number;
  imageUrl: string;
  layout: BoardLayout;
  interactive: boolean;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent, p: PiecePos) => void;
}) {
  const c = p.id % cols;
  const r = Math.floor(p.id / cols);

  const d = useMemo(() => piecePath(edges, r, c, c, r), [edges, r, c]);

  const mCX = MARGIN_CELLS; // margin in cell units (x)
  const mCY = MARGIN_CELLS;

  // screen position of the piece's nominal cell top-left
  const screenLeft = layout.originX + p.x * layout.boardW;
  const screenTop = layout.originY + p.y * layout.boardH;

  const svgLeft = screenLeft - mCX * layout.cellW;
  const svgTop = screenTop - mCY * layout.cellH;
  const svgW = (1 + 2 * mCX) * layout.cellW;
  const svgH = (1 + 2 * mCY) * layout.cellH;

  const clipId = `clip-${edges.seed}-${p.id}`;

  return (
    <div
      className="absolute"
      style={{
        left: svgLeft,
        top: svgTop,
        width: svgW,
        height: svgH,
        zIndex: p.placed ? 1 : dragging ? 1000 : 10,
        cursor: interactive && !p.placed ? (dragging ? "grabbing" : "grab") : "default",
        filter: p.placed
          ? "none"
          : dragging
            ? "drop-shadow(0 12px 18px rgba(0,0,0,0.55))"
            : "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
        transition: dragging ? "none" : "filter 120ms ease",
        willChange: "left, top",
      }}
      onPointerDown={(e) => onPointerDown(e, p)}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${c - mCX} ${r - mCY} ${1 + 2 * mCX} ${1 + 2 * mCY}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
        </defs>
        <image
          href={imageUrl}
          x={0}
          y={0}
          width={cols}
          height={rows}
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
        />
        <path
          d={d}
          fill="none"
          stroke={p.placed ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.75)"}
          strokeWidth={p.placed ? 0.006 : 0.014}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
