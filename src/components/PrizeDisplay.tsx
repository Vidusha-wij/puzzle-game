"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import PuzzleScatter from "./PuzzleScatter";
import { PRODUCTS, Product, productSrc } from "@/lib/products";

const ROTATE_MS = 60000; // new product every minute

/**
 * Main-screen idle: green "PUZZLE TO PRIZE" with a white box that cycles a
 * random product wordmark every minute. Fully fluid (vmin units).
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
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(125% 95% at 50% 72%, #57a95a 0%, #3d8544 45%, #285f33 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-[2.2vmin] rounded-[3vmin] ring-2 ring-[#1f4c28]/40" />
      <PuzzleScatter fill="#8ac98d" opacityScale={0.22} />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-[6vmin] px-[6vmin] text-center">
        <h1 className="font-black uppercase leading-[0.8] tracking-tight">
          <GreenWord className="text-[clamp(3rem,13vmin,11rem)]">Puzzle</GreenWord>
          <span className="block">
            <GreenWord className="text-[clamp(2.4rem,10vmin,9rem)]">To</GreenWord>
          </span>
          <GreenWord className="text-[clamp(4.5rem,22vmin,16rem)]">Prize</GreenWord>
        </h1>

        {/* white product box */}
        <div
          className="relative w-[76%] max-w-[86vmin] overflow-hidden rounded-[3vmin] bg-white shadow-[0_1.4vmin_4vmin_rgba(0,0,0,0.3)]"
          style={{ aspectRatio: "10 / 3" }}
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

function GreenWord({ children, className }: { children: string; className: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 translate-y-[0.05em] text-[#1f5228]" aria-hidden>
        {children}
      </span>
      <span className="relative bg-gradient-to-b from-[#b8ecb0] to-[#4fa257] bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  );
}
