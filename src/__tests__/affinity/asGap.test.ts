/**
 * Tests for affinity-as-gap (Sintonía scale).
 *
 * Hard SIA rule: affinity is a GAP that closes, never a compatibility verdict.
 * These tests pin that the output is a 4-level attunement scale (searching →
 * tuning → inSync → connected) with a 0-3 step for the bar, maps heat135 across
 * the range, falls back to heat100/compatibility, and — critically — NEVER
 * exposes a numeric compatibility/score field that could read as a verdict.
 */
import { affinityAsGap, type AttunementGap } from "@/domains/affinity/lib/asGap";

describe("affinityAsGap", () => {
  it("mapea heat135 a los 4 niveles por cuartiles", () => {
    expect(affinityAsGap({ heat135: 1 })?.level).toBe("searching"); // piso
    expect(affinityAsGap({ heat135: 40 })?.level).toBe("tuning");
    expect(affinityAsGap({ heat135: 80 })?.level).toBe("inSync");
    expect(affinityAsGap({ heat135: 135 })?.level).toBe("connected"); // techo
  });

  it("step va de 0 a 3 alineado con el nivel", () => {
    expect(affinityAsGap({ heat135: 1 })?.step).toBe(0);
    expect(affinityAsGap({ heat135: 135 })?.step).toBe(3);
  });

  it("usa heat100 como fallback", () => {
    expect(affinityAsGap({ heat100: 10 })?.level).toBe("searching");
    expect(affinityAsGap({ heat100: 90 })?.level).toBe("connected");
  });

  it("reinterpreta compatibility legacy SIN exponerla como número", () => {
    const gap = affinityAsGap({ compatibility: 85 });
    expect(gap?.level).toBe("connected");
    // El objeto de salida NO tiene ningún campo numérico de compatibilidad/score.
    const keys = Object.keys(gap as AttunementGap);
    expect(keys).toEqual(expect.arrayContaining(["level", "step", "labelKey", "hintKey"]));
    expect(keys).not.toContain("compatibility");
    expect(keys).not.toContain("score");
    expect(keys).not.toContain("percent");
  });

  it("devuelve null sin ninguna señal numérica", () => {
    expect(affinityAsGap({})).toBeNull();
    expect(affinityAsGap({ heat135: null, heat100: null, compatibility: null })).toBeNull();
  });

  it("expone claves i18n, no texto literal (nada de '% compatible')", () => {
    const gap = affinityAsGap({ heat135: 70 });
    expect(gap?.labelKey).toMatch(/^affinity\.attunement\./);
    expect(gap?.hintKey).toMatch(/^affinity\.attunement\.hint\./);
  });

  it("clampa valores fuera de rango", () => {
    expect(affinityAsGap({ heat135: 999 })?.level).toBe("connected");
    expect(affinityAsGap({ heat100: -5 })?.level).toBe("searching");
  });
});
