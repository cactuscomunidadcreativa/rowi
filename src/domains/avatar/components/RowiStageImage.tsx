"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * RowiStageImage — renderiza al personaje Rowi por ETAPA de Becoming usando los
 * 6 vectores en orden (Rowi-01→06), uno por etapa. La progresión 01→06 ES la
 * evolución del personaje; ningún vector se salta.
 *
 * Eje ETAPA (Becoming, 6 vectores en secuencia) vs eje NIVEL (Foundation/SEI,
 * en la tarjeta Foundation). Las dos representaciones conviven.
 */

export type RowiStage = "EGG" | "HATCHING" | "BABY" | "YOUNG" | "ADULT" | "WISE";

/**
 * Asset por etapa de Becoming: los 6 vectores Rowi en orden (01→06), uno por
 * etapa. La progresión del personaje ES la evolución 01→06; no se salta ninguno.
 */
const STAGE_ASSET: Record<RowiStage, string> = {
  EGG: "/rowivectors/Rowi-01.webp",
  HATCHING: "/rowivectors/Rowi-02.webp",
  BABY: "/rowivectors/Rowi-03.webp",
  YOUNG: "/rowivectors/Rowi-04.webp",
  ADULT: "/rowivectors/Rowi-05.webp",
  WISE: "/rowivectors/Rowi-06.webp",
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
