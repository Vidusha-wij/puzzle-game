"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { PRODUCTS, Product, productSrc } from "@/lib/products";

const ROTATE_MS = 60000; // new product every minute

/**
 * Main-screen idle: the branded "Puzzle to Prize" artwork (real vector assets
 * from design) with a white box that cycles a random product wordmark every
 * minute. Background + pattern use object-cover so they fill any screen size
 * or aspect ratio without distortion; the title and box scale with vmin units.
 */
export default function PrizeDisplay() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (PRODUCTS.length < 2) return;
    setIdx(Math.floor(Math.random() * PRODUCTS.length));
    const id = setInterval(() => {
      setIdx((cur) => {
        let next = cur;
        while (next === cur) next = Math.floor(Math.random() * PRODUCTS.length);
        return next;
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1c4524]">
      <img
        src="/display/background.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src="/display/pattern.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[6vmin] px-[6vmin] text-center">
        <img
          src="/display/puzzle-to-prize.svg"
          alt="Puzzle to Prize"
          className="w-[82%] max-w-[100vmin] object-contain drop-shadow-[0_1vmin_2vmin_rgba(0,0,0,0.35)]"
        />

        {/* white product box */}
        <div
          className="relative w-[76%] max-w-[86vmin] overflow-hidden rounded-[3vmin] bg-white shadow-[0_1.4vmin_4vmin_rgba(0,0,0,0.3)]"
          style={{ aspectRatio: "6.2 / 1" }}
        >
          {PRODUCTS.map((p, i) => (
            <ProductMark key={p.key} product={p} active={i === idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductMark({ product, active }: { product: Product; active: boolean }) {
  // Preload the artwork; only swap to it once it actually loads, otherwise keep
  // the styled-text fallback (no broken-image icon while files are missing).
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const img = new Image();
    const url = productSrc(product.key);
    img.onload = () => live && setSrc(url);
    img.onerror = () => live && setSrc(null);
    img.src = url;
    return () => {
      live = false;
    };
  }, [product.key]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-[3.5vmin] transition-opacity duration-700 ease-in-out"
      style={{ opacity: active ? 1 : 0 }}
    >
      {src ? (
        <img
          src={src}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span
          className="font-black uppercase leading-none tracking-tight text-[clamp(1.6rem,7vmin,5rem)]"
          style={product.serif ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined}
        >
          {product.parts.map((part, i) => (
            <span key={i} style={{ color: part.color }}>
              {part.text}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
