"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { PRESET_IMAGES } from "@/lib/images";

const INTERVAL_MS = 45000; // switch every 45 seconds
const FADE_MS = 1500; // crossfade duration

/**
 * Big-screen idle slideshow: shows the preset images, switching to a *random*
 * different one every 45s with a smooth crossfade.
 */
export default function Attract() {
  // Start at 0 for SSR + first client render (no hydration mismatch), then
  // randomise the start and rotate on the client.
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (PRESET_IMAGES.length < 2) return;
    setIdx(Math.floor(Math.random() * PRESET_IMAGES.length));
    const id = setInterval(() => {
      setIdx((cur) => {
        let next = cur;
        while (next === cur) next = Math.floor(Math.random() * PRESET_IMAGES.length);
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {PRESET_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === idx ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}
