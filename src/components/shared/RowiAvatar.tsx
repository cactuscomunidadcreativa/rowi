"use client";

import Image from "next/image";
import {
  STAGE_ASSET,
  type RowiStage,
} from "@/domains/avatar/components/RowiStageImage";

/* =========================================================
   🐣 RowiAvatar — avatar con los vectores Rowi (como el demo)
   ---------------------------------------------------------
   Los 6 vectores son las ETAPAS de evolución del personaje
   (huevo→sabio), no personajes distintos. Por eso:
   - Si conocemos la etapa real de la persona (p.ej. el propio
     usuario vía /api/avatar), se pasa `stage` y se muestra SU
     Rowi — el mismo que ve en su perfil.
   - Si no la conocemos (miembros, contactos externos), se
     elige un ave de forma determinística por seed (etapas
     BABY→WISE, nunca huevos: un invitado no es un huevo).
========================================================= */

const FALLBACK_STAGES: RowiStage[] = ["BABY", "YOUNG", "ADULT", "WISE"];

export function rowiVectorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return STAGE_ASSET[FALLBACK_STAGES[h % FALLBACK_STAGES.length]];
}

export default function RowiAvatar({
  seed,
  stage,
  size = 36,
  className = "",
}: {
  /** Nombre o id estable de la persona (fallback determinístico). */
  seed: string;
  /** Etapa REAL del avatar si se conoce — manda sobre el seed. */
  stage?: RowiStage | null;
  /** Lado en px (el contenedor es cuadrado). */
  size?: number;
  className?: string;
}) {
  const src = stage ? STAGE_ASSET[stage] : rowiVectorFor(seed || "rowi");
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-contain"
        sizes={`${size}px`}
      />
    </div>
  );
}
