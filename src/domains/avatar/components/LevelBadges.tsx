"use client";

import { cn } from "@/lib/utils";
import { Brain, TreePine } from "lucide-react";

// Colores Six Seconds
const SIX_SECONDS_CONFIG: Record<number, { color: string; name: { es: string; en: string; pt: string; it: string } }> = {
  1: { color: "#ef4444", name: { es: "Desafio", en: "Challenge", pt: "Desafio", it: "Sfida" } },
  2: { color: "#f59e0b", name: { es: "Emergente", en: "Emerging", pt: "Emergente", it: "Emergente" } },
  3: { color: "#3b82f6", name: { es: "Funcional", en: "Functional", pt: "Funcional", it: "Funzionale" } },
  4: { color: "#8b5cf6", name: { es: "Diestro", en: "Skilled", pt: "Habilidoso", it: "Abile" } },
  5: { color: "#10b981", name: { es: "Experto", en: "Expert", pt: "Especialista", it: "Esperto" } },
};

// Nombres Rowi Level
const ROWI_LEVEL_NAMES: Record<number, { es: string; en: string; pt: string; it: string }> = {
  1: { es: "Semilla", en: "Seed", pt: "Semente", it: "Seme" },
  2: { es: "Brote", en: "Sprout", pt: "Broto", it: "Germoglio" },
  3: { es: "Planta", en: "Plant", pt: "Planta", it: "Pianta" },
  4: { es: "Arbol Joven", en: "Young Tree", pt: "Árvore Jovem", it: "Albero Giovane" },
  5: { es: "Arbol", en: "Tree", pt: "Árvore", it: "Albero" },
  6: { es: "Arbol Fuerte", en: "Strong Tree", pt: "Árvore Forte", it: "Albero Forte" },
  7: { es: "Arbol Sabio", en: "Wise Tree", pt: "Árvore Sábia", it: "Albero Saggio" },
  8: { es: "Bosque", en: "Forest", pt: "Floresta", it: "Foresta" },
  9: { es: "Guardian", en: "Guardian", pt: "Guardião", it: "Guardiano" },
  10: { es: "Ancestro", en: "Ancestor", pt: "Ancestral", it: "Antenato" },
};

export interface LevelBadgesProps {
  sixSecondsLevel: number;
  rowiLevel: number;
  lang?: "es" | "en" | "pt" | "it";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { container: "gap-1.5", badge: "px-2 py-0.5", text: "text-[9px]", value: "text-xs" },
  md: { container: "gap-2", badge: "px-2 py-1", text: "text-[10px]", value: "text-sm" },
  lg: { container: "gap-3", badge: "px-3 py-1.5", text: "text-xs", value: "text-base" },
};

/**
 * LevelBadges - Muestra los badges de nivel Six Seconds y Rowi
 *
 * @example
 * <LevelBadges sixSecondsLevel={3} rowiLevel={5} lang="es" />
 */
export function LevelBadges({
  sixSecondsLevel,
  rowiLevel,
  lang = "es",
  size = "md",
  showLabels = true,
  className,
}: LevelBadgesProps) {
  const sixSecondsConfig = SIX_SECONDS_CONFIG[sixSecondsLevel] || SIX_SECONDS_CONFIG[1];
  const rowiLevelName = ROWI_LEVEL_NAMES[rowiLevel] || ROWI_LEVEL_NAMES[1];

  return (
    <div className={cn("grid grid-cols-2", sizeClasses[size].container, className)}>
      {/* Badge Six Seconds */}
      <div
        className={cn("rounded-lg text-center", sizeClasses[size].badge)}
        style={{ backgroundColor: `${sixSecondsConfig.color}15` }}
      >
        {showLabels && (
          <p className={cn("uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1", sizeClasses[size].text)}>
            <Brain className="w-3 h-3" />
            Six Seconds
          </p>
        )}
        <p
          className={cn("font-bold", sizeClasses[size].value)}
          style={{ color: sixSecondsConfig.color }}
        >
          L{sixSecondsLevel} {sixSecondsConfig.name[lang]}
        </p>
      </div>

      {/* Badge Rowi Level */}
      <div
        className={cn(
          "rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center",
          sizeClasses[size].badge
        )}
      >
        {showLabels && (
          <p className={cn("uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1", sizeClasses[size].text)}>
            <TreePine className="w-3 h-3" />
            {lang === "es" ? "Nivel Rowi" : lang === "pt" ? "Nível Rowi" : lang === "it" ? "Livello Rowi" : "Rowi Level"}
          </p>
        )}
        <p className={cn("font-bold text-emerald-600 dark:text-emerald-400", sizeClasses[size].value)}>
          L{rowiLevel} {rowiLevelName[lang]}
        </p>
      </div>
    </div>
  );
}

export default LevelBadges;
