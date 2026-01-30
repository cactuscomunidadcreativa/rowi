"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Configuracion de stages
const AVATAR_STAGES = {
  EGG: { emoji: "🥚", color: "#94a3b8", bg: "#94a3b820" },
  HATCHING: { emoji: "🐣", color: "#fbbf24", bg: "#fbbf2420" },
  BABY: { emoji: "🐥", color: "#fb923c", bg: "#fb923c20" },
  YOUNG: { emoji: "🦉", color: "#3b82f6", bg: "#3b82f620" },
  ADULT: { emoji: "🦅", color: "#8b5cf6", bg: "#8b5cf620" },
  WISE: { emoji: "🪶", color: "#10b981", bg: "#10b98120" },
};

// Colores Six Seconds
const SIX_SECONDS_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f59e0b",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981",
};

export interface AvatarDisplayProps {
  stage: keyof typeof AVATAR_STAGES;
  sixSecondsLevel?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-sm",
  sm: "h-8 w-8 text-lg",
  md: "h-12 w-12 text-2xl",
  lg: "h-16 w-16 text-4xl",
  xl: "h-24 w-24 text-6xl",
};

const badgeSizeClasses = {
  xs: "h-3 w-3 text-[8px] -bottom-0.5 -right-0.5",
  sm: "h-4 w-4 text-[10px] -bottom-1 -right-1",
  md: "h-5 w-5 text-xs -bottom-1 -right-1",
  lg: "h-6 w-6 text-sm -bottom-1 -right-1",
  xl: "h-8 w-8 text-base -bottom-2 -right-2",
};

/**
 * AvatarDisplay - Muestra el avatar Rowi con su stage actual
 *
 * @example
 * <AvatarDisplay stage="YOUNG" sixSecondsLevel={3} size="md" showBadge />
 */
export function AvatarDisplay({
  stage,
  sixSecondsLevel,
  size = "md",
  showBadge = true,
  animate = true,
  className,
}: AvatarDisplayProps) {
  const stageConfig = AVATAR_STAGES[stage] || AVATAR_STAGES.EGG;

  const avatarContent = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        sizeClasses[size]
      )}
      style={{ backgroundColor: stageConfig.bg }}
    >
      {stageConfig.emoji}
    </span>
  );

  return (
    <div className={cn("relative inline-block", className)}>
      {animate ? (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {avatarContent}
        </motion.div>
      ) : (
        avatarContent
      )}

      {/* Badge de nivel Six Seconds */}
      {showBadge && sixSecondsLevel && (
        <span
          className={cn(
            "absolute rounded-full font-bold flex items-center justify-center text-white border-2 border-white dark:border-zinc-900",
            badgeSizeClasses[size]
          )}
          style={{ backgroundColor: SIX_SECONDS_COLORS[sixSecondsLevel] || "#3b82f6" }}
        >
          {sixSecondsLevel}
        </span>
      )}
    </div>
  );
}

export default AvatarDisplay;
