// Shared types for the two-device jigsaw booth.
//
// One Supabase row (game_state, id='singleton') is the shared state machine.
// The laptop (/play) is the "driver": it writes state and broadcasts live
// piece motion. The big screen (/display) is a read-only mirror.

export type GameStatus =
  | "idle" // attract screen, waiting for a player
  | "capturing" // entering name + phone
  | "uploading" // choosing / uploading the photo
  | "playing" // solving the puzzle
  | "solved"; // results + leaderboard, then auto back to idle

export interface PuzzleConfig {
  rows: number;
  cols: number;
  imageUrl: string;
  /** Natural image aspect ratio (w/h) so both devices size the board identically. */
  aspect: number;
  /** Seed so both devices generate byte-identical jigsaw edges. */
  seed: number;
}

/** A piece position, normalized to the board rect (0,0)=board top-left, (1,1)=board bottom-right. */
export interface PiecePos {
  id: number; // r * cols + c
  x: number; // normalized left of the piece's nominal cell
  y: number; // normalized top
  placed: boolean; // locked into its home cell
}

export interface GameStateRow {
  id: "singleton";
  status: GameStatus;
  driver_device_id: string | null;
  player_name: string | null;
  player_phone: string | null;
  player_slmc: string | null;
  photo_url: string | null;
  puzzle_config: PuzzleConfig | null;
  pieces_placed: PiecePos[];
  started_at: string | null;
  solved_at: string | null;
  time_ms: number | null;
  version: number;
}

export interface LeaderboardRow {
  id: number;
  name: string;
  phone: string;
  slmc: string | null;
  time_ms: number;
  created_at: string;
}

/** Realtime broadcast payload for smooth live mirroring while dragging. */
export interface LivePayload {
  positions: PiecePos[];
  elapsedMs: number;
}

export const LIVE_CHANNEL = "puzzle-live";
export const LIVE_EVENT = "pieces";
