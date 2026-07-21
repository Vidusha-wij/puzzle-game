// Preset puzzle / attract images (Celogen products). Files live in public/game.
// One is picked at random for the attract screen and for each puzzle.

export const PRESET_IMAGES = [
  "/game/Atogen.png",
  "/game/Empabest.png",
  "/game/Pantogen.png",
  "/game/Vertisit.png",
];

/** Portrait banners (1009x2048). Fallback aspect if an image fails to measure. */
export const PRESET_ASPECT = 1009 / 2048;

export function randomImage(): string {
  return PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)];
}

/** Measure an image's aspect (w/h) from a URL. Never rejects. */
export function imageAspectFromUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(PRESET_ASPECT);
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / Math.max(1, img.naturalHeight));
    img.onerror = () => resolve(PRESET_ASPECT);
    img.src = url;
  });
}
