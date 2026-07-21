"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * In-page webcam capture for the laptop. Streams the camera, lets the player
 * snap a frame, and returns it as a JPEG File.
 *
 * NOTE: getUserMedia only works in a secure context — https (the Vercel URL) or
 * localhost. Over a plain http LAN IP the browser blocks the camera; use the
 * upload option there.
 */
export default function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This device/browser can't open the camera. Upload a photo instead.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.onloadedmetadata = () => setReady(true);
          v.play().catch(() => {});
        }
      })
      .catch(() => {
        setError(
          "Couldn't access the camera. Allow camera permission, or upload a photo instead."
        );
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the capture matches the on-screen (mirrored) preview.
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stop();
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  if (error) {
    return (
      <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={onCancel}
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/15">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[4/3] w-full -scale-x-100 object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
            Starting camera…
          </div>
        )}
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={onCancel}
          className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
        >
          Back
        </button>
        <button
          onClick={capture}
          disabled={!ready}
          className="flex-1 rounded-xl bg-accent py-3 text-lg font-extrabold text-black transition hover:bg-emerald-300 active:scale-[0.98] disabled:opacity-40"
        >
          📸 Capture
        </button>
      </div>
    </div>
  );
}
