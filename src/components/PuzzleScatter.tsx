// Faint scattered puzzle pieces used behind the attract / display screens.

const PIECE_PATH =
  "M20,20 L44,20 A8,8 0 1 1 60,20 L80,20 L80,44 A8,8 0 1 1 80,60 L80,80 L20,80 Z";

// left%, top%, size(vmin), rotation(deg), opacity.
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

export default function PuzzleScatter({
  fill,
  opacityScale = 1,
}: {
  fill: string;
  opacityScale?: number;
}) {
  return (
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
            fill={fill}
            opacity={o * opacityScale}
            transform={`rotate(${r} 50 50)`}
          />
        </svg>
      ))}
    </svg>
  );
}
