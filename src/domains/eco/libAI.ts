// src/domains/eco/libAI.ts
// 🔹 Placeholder temporal para compilar Rowi.
// Cuando el dominio Eco esté activo, este módulo se reemplazará por su versión real.

export async function analyzeEcoContext(input: any) {
  console.log("🌱 Eco AI placeholder ejecutado:", input);
  return {
    insights: ["Sostenibilidad base", "Sinergia ambiental detectada"],
    score: 0.8,
    suggestions: ["Optimizar recursos", "Reducir emisiones"],
  };
}

export const ecoVersion = "0.0.1-dev";

// ✅ NUEVO: flag para habilitar el refinamiento LLM en ECO
export function isEcoLLMEnabled() {
  return process.env.ECO_LLM_ENABLED === "true";
}

// (opcional) modelo por defecto si lo necesitas en el dominio
export function getEcoModel() {
  return process.env.ECO_LLM_MODEL || "gpt-4o-mini";
}