/**
 * Unit tests for the Pre-SEI live normative comparison.
 *
 * Two honesty guarantees are pinned: (1) when a demographic segment has fewer
 * than MIN_SAMPLE_SIZE samples, the comparison falls back down the chain to a
 * broader level (and reports which level was used and its N), and (2) when no
 * benchmark exists at all, it degrades to internal bands (no fabricated
 * percentile). The stat fetcher is injected, so these tests are pure.
 */
import {
  normativeForCompetency,
  normativeReadings,
  type StatFetcher,
} from "@/lib/pre-sei/normative";
import { MIN_SAMPLE_SIZE } from "@/lib/benchmarks/statistics";
import { SEI_ORDER } from "@/lib/pre-sei/questions";
import type { SeiKey } from "@/lib/vital-signs/catalog";

const ctx = { country: "EC", sector: "Education", region: "LATAM" };

describe("normativeForCompetency", () => {
  it("sin benchmark en ningún nivel → bandas internas, sin percentil", () => {
    const fetch: StatFetcher = () => ({ data: null, sampleSize: 0 });
    const r = normativeForCompetency("EL", 130, ctx, fetch);
    expect(r.internalBands).toBe(true);
    expect(r.percentile).toBeNull();
    expect(r.fallbackLevel).toBeNull();
    expect(r.band).toBe("above"); // 130 > 110
  });

  it("bandas internas around/below en la norma", () => {
    const fetch: StatFetcher = () => ({ data: null, sampleSize: 0 });
    expect(normativeForCompetency("EL", 100, ctx, fetch).band).toBe("around");
    expect(normativeForCompetency("EL", 70, ctx, fetch).band).toBe("below");
  });

  it("segmento exacto con N suficiente → fallbackLevel exact", () => {
    const fetch: StatFetcher = (_sei, c) => {
      // Solo el contexto con country+sector+region devuelve muestra suficiente.
      if (c.country && c.sector) {
        return { data: { mean: 100, stdDev: 10, sampleSize: 50 }, sampleSize: 50 };
      }
      return { data: null, sampleSize: 0 };
    };
    const r = normativeForCompetency("EL", 115, ctx, fetch);
    expect(r.internalBands).toBe(false);
    expect(r.fallbackLevel).toBe("exact");
    expect(r.sampleSize).toBe(50);
    expect(r.band).toBe("above"); // 115 > 100 + 5
    expect(r.percentile).not.toBeNull();
  });

  it("segmento con N<MIN baja la cadena hasta global", () => {
    const fetch: StatFetcher = (_sei, c) => {
      const empty = !c.country && !c.sector && !c.region;
      if (empty) return { data: { mean: 100, stdDev: 12, sampleSize: 5000 }, sampleSize: 5000 };
      // Cualquier segmento más específico no llega al mínimo.
      return { data: { mean: 100, stdDev: 12, sampleSize: MIN_SAMPLE_SIZE - 1 }, sampleSize: MIN_SAMPLE_SIZE - 1 };
    };
    const r = normativeForCompetency("EL", 100, ctx, fetch);
    expect(r.internalBands).toBe(false);
    expect(r.fallbackLevel).toBe("global");
    expect(r.sampleSize).toBe(5000);
    expect(r.band).toBe("around");
  });

  it("sin SD no produce percentil aunque haya media", () => {
    const fetch: StatFetcher = () => ({ data: { mean: 100, stdDev: null, sampleSize: 100 }, sampleSize: 100 });
    const r = normativeForCompetency("EL", 120, ctx, fetch);
    expect(r.percentile).toBeNull();
    expect(r.band).toBe("above"); // margen ±5 sin SD
  });

  it("percentil crece con el score", () => {
    const fetch: StatFetcher = () => ({ data: { mean: 100, stdDev: 10, sampleSize: 200 }, sampleSize: 200 });
    const low = normativeForCompetency("EL", 85, ctx, fetch).percentile!;
    const mid = normativeForCompetency("EL", 100, ctx, fetch).percentile!;
    const high = normativeForCompetency("EL", 115, ctx, fetch).percentile!;
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(mid).toBe(50); // en la media
  });
});

describe("normativeReadings", () => {
  it("computa las 8 competencias", () => {
    const comps = SEI_ORDER.reduce((acc, sei) => {
      acc[sei] = 100;
      return acc;
    }, {} as Record<SeiKey, number>);
    const fetch: StatFetcher = () => ({ data: null, sampleSize: 0 });
    const readings = normativeReadings(comps, ctx, fetch);
    expect(readings).toHaveLength(8);
    expect(new Set(readings.map((r) => r.sei)).size).toBe(8);
  });
});
