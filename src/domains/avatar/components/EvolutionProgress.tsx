"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Configuracion de stages
const AVATAR_STAGES = {
  EGG: { emoji: "🥚", color: "#94a3b8", name: { es: "Huevito", en: "Egg", pt: "Ovinho", it: "Uovetto" } },
  HATCHING: { emoji: "🐣", color: "#fbbf24", name: { es: "Eclosionando", en: "Hatching", pt: "Chocando", it: "Schiusa" } },
  BABY: { emoji: "🐥", color: "#fb923c", name: { es: "Bebe", en: "Baby", pt: "Bebê", it: "Neonato" } },
  YOUNG: { emoji: "🦉", color: "#3b82f6", name: { es: "Joven", en: "Young", pt: "Jovem", it: "Giovane" } },
  ADULT: { emoji: "🦅", color: "#8b5cf6", name: { es: "Adulto", en: "Adult", pt: "Adulto", it: "Adulto" } },
  WISE: { emoji: "🪶", color: "#10b981", name: { es: "Sabio", en: "Wise", pt: "Sábio", it: "Saggio" } },
};

type Stage = keyof typeof AVATAR_STAGES;

export interface EvolutionProgressProps {
  currentStage: Stage;
  nextStage: Stage | null;
  progress: number; // 0-100
  isHatched: boolean;
  hatchProgress?: number; // 0-100 for eggs
  lang?: "es" | "en" | "pt" | "it";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { bar: "h-1.5", text: "text-[10px]" },
  md: { bar: "h-2", text: "text-xs" },
  lg: { bar: "h-3", text: "text-sm" },
};

/**
 * EvolutionProgress - Barra de progreso de evolucion del avatar
 *
 * @example
 * <EvolutionProgress
 *   currentStage="YOUNG"
 *   nextStage="ADULT"
 *   progress={65}
 *   isHatched={true}
 *   lang="es"
 * />
 */
export function EvolutionProgress({
  currentStage,
  nextStage,
  progress,
  isHatched,
  hatchProgress = 0,
  lang = "es",
  showLabel = true,
  size = "md",
  className,
}: EvolutionProgressProps) {
  const stageConfig = AVATAR_STAGES[currentStage] || AVATAR_STAGES.EGG;
  const nextStageConfig = nextStage ? AVATAR_STAGES[nextStage] : null;

  const displayProgress = isHatched ? progress : hatchProgress;
  const EVO = { es: "Evolucion", en: "Evolution", pt: "Evolução", it: "Evoluzione" };
  const HAT = { es: "Eclosion", en: "Hatching", pt: "Eclosão", it: "Schiusa" };
  const progressLabel = isHatched
    ? (EVO[lang as keyof typeof EVO] ?? EVO.en)
    : (HAT[lang as keyof typeof HAT] ?? HAT.en);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className={cn("flex justify-between mb-1", sizeClasses[size].text, "text-gray-500")}>
          <span className="flex items-center gap-1">
            {stageConfig.emoji} {progressLabel}
          </span>
          <span>{displayProgress}%</span>
        </div>
      )}

      <div
        className={cn(
          "bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden",
          sizeClasses[size].bar
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: stageConfig.color }}
        />
      </div>

      {showLabel && nextStageConfig && (
        <p className={cn("mt-1 text-gray-400", sizeClasses[size].text)}>
          {lang === "es" ? "Proxima:" : lang === "pt" ? "Próxima:" : lang === "it" ? "Prossima:" : "Next:"} {nextStageConfig.emoji}{" "}
          {nextStageConfig.name[lang]}
        </p>
      )}

      {showLabel && !nextStageConfig && isHatched && (
        <p className={cn("mt-1 text-emerald-500 font-medium", sizeClasses[size].text)}>
          {lang === "es" ? "Nivel maximo alcanzado!" : lang === "pt" ? "Nível máximo alcançado!" : lang === "it" ? "Livello massimo raggiunto!" : "Maximum level reached!"}
        </p>
      )}
    </div>
  );
}

export default EvolutionProgress;
