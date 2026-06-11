"use client";

import { motion, AnimatePresence } from "framer-motion";
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
export const STAGE_ASSET: Record<RowiStage, string> = {
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
    >
      {/* Flotación continua (vida) envuelve el cambio de etapa. */}
      <motion.div
        className="relative h-full w-full"
        animate={float ? { y: [0, -8, 0] } : undefined}
        transition={float ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {/* Crossfade entre etapas: al cambiar `stage`, la imagen anterior se
            desvanece y la nueva entra. Si justHatched, entra con un pop celebratorio. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            className="absolute inset-0"
            initial={
              justHatched
                ? { scale: 0.2, opacity: 0, rotate: -8 }
                : { scale: 0.85, opacity: 0 }
            }
            animate={
              justHatched
                ? { scale: [0.2, 1.18, 1], opacity: 1, rotate: [-8, 6, 0] }
                : { scale: 1, opacity: 1 }
            }
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: justHatched ? 0.9 : 0.45, ease: "easeOut" }}
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
        </AnimatePresence>
      </motion.div>

      {/* Ráfaga de celebración al evolucionar/eclosionar. */}
      <AnimatePresence>
        {justHatched && (
          <>
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              return (
                <motion.span
                  key={`burst-${i}`}
                  className="absolute left-1/2 top-1/2 text-xl pointer-events-none"
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.4],
                    x: Math.cos(angle) * px * 0.6,
                    y: Math.sin(angle) * px * 0.6,
                  }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                >
                  ✨
                </motion.span>
              );
            })}
            {/* Pulso de glow */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-full blur-2xl"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.4, 1] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ background: "radial-gradient(circle, #7c3aed66, transparent 70%)" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Halo cálido permanente cuando ya es búho (post-eclosión). */}
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
