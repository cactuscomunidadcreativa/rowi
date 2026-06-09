"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * RowiStageImage — renderiza los ASSETS REALES del huevo→búho por etapa de
 * Becoming (no emoji). Enciende los assets que ya existían pero nunca se usaban:
 * egg-1/2/3.png para las etapas pre-eclosión, owl.png una vez nacido.
 *
 * El eje aquí es la ETAPA (Becoming), distinto del eje nivel (Foundation/SEI,
 * que usa los vectores Rowi-0X). Las dos representaciones conviven.
 */

export type RowiStage = "EGG" | "HATCHING" | "BABY" | "YOUNG" | "ADULT" | "WISE";

/** Asset real por etapa: el huevo se va abriendo, luego nace el búho. */
const STAGE_ASSET: Record<RowiStage, string> = {
  EGG: "/egg-1.png",
  HATCHING: "/egg-2.png",
  BABY: "/egg-3.png",
  YOUNG: "/owl.png",
  ADULT: "/owl.png",
  WISE: "/owl.png",
};

const SIZE_PX: Record<NonNullable<RowiStageImageProps["size"]>, number> = {
  sm: 64,
  md: 112,
  lg: 176,
  xl: 240,
};

export interface RowiStageImageProps {
  stage: RowiStage;
  size?: "sm" | "md" | "lg" | "xl";
  /** Reproduce la animación de eclosión (un pop + sacudida) al montar. */
  justHatched?: boolean;
  /** Flotación continua (vida). */
  float?: boolean;
  className?: string;
  alt?: string;
}

export function RowiStageImage({
  stage,
  size = "lg",
  justHatched = false,
  float = true,
  className,
  alt = "Rowi",
}: RowiStageImageProps) {
  const px = SIZE_PX[size];
  const src = STAGE_ASSET[stage] ?? STAGE_ASSET.EGG;
  const isOwl = stage === "YOUNG" || stage === "ADULT" || stage === "WISE";

  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width: px, height: px }}
      // Eclosión: el búho nace con un pop; el huevo solo aparece.
      initial={
        justHatched
          ? { scale: 0.2, opacity: 0, rotate: -8 }
          : { scale: 0.9, opacity: 0 }
      }
      animate={
        justHatched
          ? { scale: [0.2, 1.15, 1], opacity: 1, rotate: [-8, 6, 0] }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: justHatched ? 0.9 : 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={float ? { y: [0, -8, 0] } : undefined}
        transition={
          float
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${px}px`}
          className="object-contain drop-shadow-2xl"
          priority={size === "lg" || size === "xl"}
        />
      </motion.div>

      {/* Halo cálido cuando ya es búho (post-eclosión) */}
      {isOwl && (
        <div
          className="absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, #7c3aed33, transparent 70%)" }}
        />
      )}
    </motion.div>
  );
}

export default RowiStageImage;
