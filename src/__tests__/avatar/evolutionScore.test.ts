/**
 * Regresión del avatar de dos ejes (arquitectura Human Growth OS).
 * Fija la fórmula 60% Becoming / 40% Mini-SEI. Si alguien cambia los pesos
 * sin querer, este test falla — entonces se actualiza con intención.
 */
import {
  calculateEvolutionScore,
  BECOMING_WEIGHT,
  BASE_SEI_WEIGHT,
} from "@/lib/eq/evolution-calculator";

describe("avatar — score de evolución (40/60)", () => {
  it("los pesos son 60% Becoming + 40% Mini-SEI y suman 1.0", () => {
    expect(BECOMING_WEIGHT).toBe(0.6);
    expect(BASE_SEI_WEIGHT).toBe(0.4);
    expect(BECOMING_WEIGHT + BASE_SEI_WEIGHT).toBeCloseTo(1.0, 5);
  });

  it("aplica la mezcla ponderada correcta", () => {
    // rowiLevel=10 (Becoming), sixSecondsLevel=5 (base) → 10*0.6 + 5*0.4 = 8
    expect(calculateEvolutionScore(10, 5)).toBeCloseTo(8, 5);
    // ambos iguales → el score iguala el nivel
    expect(calculateEvolutionScore(7, 7)).toBeCloseTo(7, 5);
    // cero en ambos → cero
    expect(calculateEvolutionScore(0, 0)).toBe(0);
  });

  it("el eje Becoming pesa más que el punto de partida", () => {
    // Subir 1 punto de Becoming aporta más que subir 1 de SEI base.
    const baseline = calculateEvolutionScore(5, 5);
    const moreBecoming = calculateEvolutionScore(6, 5);
    const moreSei = calculateEvolutionScore(5, 6);
    expect(moreBecoming - baseline).toBeGreaterThan(moreSei - baseline);
  });
});
