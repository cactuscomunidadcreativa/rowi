"use client";

import Image from "next/image";

/* =========================================================
   🐣 RowiAvatar — avatar con los vectores Rowi (como el demo)
   ---------------------------------------------------------
   Mismo look que /demo/eco y /demo/affinity: cada persona se
   representa con uno de los 6 vectores Rowi en vez de una
   inicial en un círculo. El vector se elige de forma
   determinística a partir del seed (nombre/id), así la misma
   persona siempre ve el mismo Rowi.
========================================================= */

const VECTOR_COUNT = 6;

export function rowiVectorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `/rowivectors/Rowi-0${(h % VECTOR_COUNT) + 1}.webp`;
}

export default function RowiAvatar({
  seed,
  size = 36,
  className = "",
}: {
  /** Nombre o id estable de la persona. */
  seed: string;
  /** Lado en px (el contenedor es cuadrado). */
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={rowiVectorFor(seed || "rowi")}
        alt=""
        fill
        className="object-contain"
        sizes={`${size}px`}
      />
    </div>
  );
}
