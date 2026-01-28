// src/domains/eq/lib/eqLevels.ts
export const EQ_MAX = 135 as const;

export type RowiLevelKey = "desafio"|"emergente"|"funcional"|"diestro"|"experto";

export const EQ_LEVELS: Array<{
  key: RowiLevelKey;
  label: string;
  min: number;
  max: number;
  color: string;
}> = [
  { key: "desafio",   label: "Desafío",   min:  65, max:  81, color: "#d32f2f" }, // rojo
  { key: "emergente", label: "Emergente", min:  82, max:  91, color: "#f57c00" }, // naranja
  { key: "funcional", label: "Funcional", min:  92, max: 107, color: "#fbc02d" }, // amarillo
  { key: "diestro",   label: "Diestro",   min: 108, max: 117, color: "#7cb342" }, // verde claro
  { key: "experto",   label: "Experto",   min: 118, max: 135, color: "#388e3c" }, // verde fuerte
];

// Devuelve el nivel (texto + color) según puntaje REAL 0–135
export function getEqLevel(score?: number | null) {
  if (score == null) return { key: null, label: "—", color: "#ccc" as const };
  for (const lvl of EQ_LEVELS) {
    if (score >= lvl.min && score <= lvl.max) return lvl;
  }
  if (score < 65) return { key: "desafio", label: "Desafío", color: "#d32f2f" } as const;
  return { key: "experto", label: "Experto", color: "#388e3c" } as const;
}

// Útil para pintar anchos internos, sin mostrar %
export function toPercentOf135(score?: number | null) {
  if (score == null) return 0;
  return Math.max(0, Math.min(100, Math.round((score / EQ_MAX) * 100)));
}