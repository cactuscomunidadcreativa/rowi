import {
  questionForToday,
  SEI_ORDER,
  DAILY_PULSE_QUESTIONS,
} from "@/lib/daily-pulse/questions";
import { preSeiQuestions } from "@/lib/pre-sei/questions";

/**
 * Rotación de redacciones (feedback Eduardo 2026-06-10): ni el pulse ni el
 * espejo deben repetir la misma frase en días/ciclos consecutivos. La
 * competencia medida y la escala no cambian — solo el enunciado.
 */
describe("rotación de enunciados", () => {
  it("el pulse cambia de COMPETENCIA cada día", () => {
    const d1 = questionForToday(new Date("2026-06-10T12:00:00Z"), 0);
    const d2 = questionForToday(new Date("2026-06-11T12:00:00Z"), 0);
    expect(d1.sei).not.toBe(d2.sei);
  });

  it("el pulse cambia de REDACCIÓN para la misma competencia en ciclos consecutivos", () => {
    // Mismo sei cada 8 días; la frase debe ser otra en el siguiente ciclo.
    const base = new Date("2026-06-10T12:00:00Z");
    const nextCycle = new Date(base.getTime() + 8 * 24 * 60 * 60 * 1000);
    const q1 = questionForToday(base, 0);
    const q2 = questionForToday(nextCycle, 0);
    expect(q1.sei).toBe(q2.sei);
    expect(q1.esQuestion).not.toBe(q2.esQuestion);
    // La pregunta sigue midiendo lo mismo: pulse point y feedback intactos.
    expect(q2.pulsePointCode).toBe(q1.pulsePointCode);
    expect(q2.esFeedback).toEqual(q1.esFeedback);
  });

  it("tras 3 ciclos (24 días) vuelve a la redacción base", () => {
    const base = new Date("2026-06-10T12:00:00Z");
    const threeCycles = new Date(base.getTime() + 24 * 24 * 60 * 60 * 1000);
    const q1 = questionForToday(base, 0);
    const q2 = questionForToday(threeCycles, 0);
    expect(q2.esQuestion).toBe(q1.esQuestion);
  });

  it("el espejo (pre-SEI) muestra redacciones distintas en días distintos", () => {
    const day1 = preSeiQuestions("es", new Date("2026-06-10T12:00:00Z"));
    const day2 = preSeiQuestions("es", new Date("2026-06-11T12:00:00Z"));
    expect(day1).toHaveLength(8);
    expect(day2).toHaveLength(8);
    // Mismas competencias en el mismo orden…
    expect(day1.map((q) => q.sei)).toEqual(day2.map((q) => q.sei));
    // …pero NINGUNA frase repetida entre días consecutivos (3 variantes).
    day1.forEach((q, i) => expect(q.prompt).not.toBe(day2[i].prompt));
  });

  it("el espejo vuelve a la variante base cada 3 días", () => {
    const day1 = preSeiQuestions("es", new Date("2026-06-10T12:00:00Z"));
    const day4 = preSeiQuestions("es", new Date("2026-06-13T12:00:00Z"));
    day1.forEach((q, i) => expect(q.prompt).toBe(day4[i].prompt));
  });

  it("todas las variantes existen en los 4 idiomas para las 8 competencias", () => {
    for (const lang of ["es", "en", "pt", "it"] as const) {
      for (let day = 0; day < 3; day++) {
        const qs = preSeiQuestions(lang, new Date(Date.UTC(2026, 0, 1 + day, 12)));
        expect(qs.map((q) => q.sei)).toEqual(SEI_ORDER);
        qs.forEach((q) => expect(q.prompt.length).toBeGreaterThan(10));
      }
    }
    // Y el pulse: 3 ciclos × 8 días sin frases vacías ni iguales a "".
    for (let day = 0; day < 24; day++) {
      const q = questionForToday(new Date(Date.UTC(2026, 0, 1 + day, 12)), 0);
      expect(q.esQuestion.length).toBeGreaterThan(10);
      expect(q.enQuestion.length).toBeGreaterThan(10);
      expect(q.ptQuestion.length).toBeGreaterThan(10);
      expect(q.itQuestion.length).toBeGreaterThan(10);
      expect(DAILY_PULSE_QUESTIONS[q.sei]).toBeDefined();
    }
  });
});
