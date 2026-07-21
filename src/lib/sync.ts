"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import {
  GameStateRow,
  LivePayload,
  LIVE_CHANNEL,
  LIVE_EVENT,
  PiecePos,
  PuzzleConfig,
} from "./types";

// ---- device identity (stable per browser) --------------------------------

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "puzzle_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto.randomUUID?.() as string) ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

// ---- shared game_state (singleton) ---------------------------------------

export function useGameState() {
  const [state, setState] = useState<GameStateRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    supabase
      .from("game_state")
      .select("*")
      .eq("id", "singleton")
      .single()
      .then(({ data }) => {
        if (active && data) setState(data as GameStateRow);
        if (active) setLoaded(true);
      });

    const channel = supabase
      .channel("game_state_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: "id=eq.singleton",
        },
        (payload) => {
          if (payload.new) setState(payload.new as GameStateRow);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { state, loaded };
}

// ---- driver writes --------------------------------------------------------

async function patch(update: Partial<GameStateRow>) {
  const { error } = await supabase
    .from("game_state")
    .update(update)
    .eq("id", "singleton");
  if (error) console.error("game_state update failed:", error.message);
}

export const driver = {
  /** Player tapped "Play now": claim the booth and reset the round. */
  async beginCapture(deviceId: string) {
    await patch({
      status: "capturing",
      driver_device_id: deviceId,
      player_name: null,
      player_phone: null,
      photo_url: null,
      puzzle_config: null,
      pieces_placed: [],
      started_at: null,
      solved_at: null,
      time_ms: null,
      version: Math.floor(Date.now() / 1000),
    });
  },

  async setPlayer(name: string, phone: string) {
    await patch({ player_name: name, player_phone: phone, status: "uploading" });
  },

  /** Called by the display once the puzzle image is uploaded. The timer does
   * NOT start here — it starts when the player touches the first piece. */
  async startPlay(config: PuzzleConfig, initialPieces: PiecePos[]) {
    await patch({
      photo_url: config.imageUrl,
      puzzle_config: config,
      pieces_placed: initialPieces,
      status: "playing",
      started_at: null,
    });
  },

  /** Start the clock — fired the moment the player grabs the first piece. */
  async startTimer() {
    await patch({ started_at: new Date().toISOString() });
  },

  /** Persist an occasional snapshot (on snap events) for durability. */
  async snapshot(pieces: PiecePos[]) {
    await patch({ pieces_placed: pieces });
  },

  async finish(timeMs: number, finalPieces: PiecePos[]) {
    await patch({
      status: "solved",
      solved_at: new Date().toISOString(),
      time_ms: timeMs,
      pieces_placed: finalPieces,
    });
  },

  async resetIdle() {
    await patch({
      status: "idle",
      driver_device_id: null,
      player_name: null,
      player_phone: null,
      photo_url: null,
      puzzle_config: null,
      pieces_placed: [],
      started_at: null,
      solved_at: null,
      time_ms: null,
    });
  },
};

// ---- live broadcast (high-frequency piece motion) -------------------------

/** Driver side: returns a throttled `send` for live piece positions. */
export function useLiveSender() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    const channel = supabase.channel(LIVE_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") ready.current = true;
    });
    channelRef.current = channel;
    return () => {
      ready.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return useCallback((payload: LivePayload) => {
    if (!channelRef.current || !ready.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: LIVE_EVENT,
      payload,
    });
  }, []);
}

/** Display side: subscribe to live piece positions. */
export function useLiveReceiver(onMessage: (p: LivePayload) => void) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    const channel = supabase.channel(LIVE_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: LIVE_EVENT }, ({ payload }) => {
        cbRef.current(payload as LivePayload);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
