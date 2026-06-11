import {
  localDateString,
  startOfLocalDay,
  parseTz,
} from "@/lib/daily-pulse/timezone";

/**
 * Contrato: tzOffsetMinutes es Date.getTimezoneOffset() SIN negar —
 * positivo detrás de UTC (Ecuador UTC-5 → +300). El bug P0 del loop
 * diario era el cliente enviando el offset negado, corriendo el día
 * local. Estos tests fijan el contrato para ambos lados.
 */
describe("daily-pulse timezone contract", () => {
  // 2026-06-10 19:00 en Ecuador = 2026-06-11 00:00 UTC
  const eveningEcuadorUtc = new Date("2026-06-11T00:00:00Z");

  it("localDateString con tz=300 (Ecuador): las 19:00 locales siguen siendo el mismo día", () => {
    expect(localDateString(eveningEcuadorUtc, 300)).toBe("2026-06-10");
  });

  it("localDateString con el offset NEGADO (-300) corre el día — el bug que no debe volver", () => {
    expect(localDateString(eveningEcuadorUtc, -300)).toBe("2026-06-11");
  });

  it("localDateString con tz=0 (UTC) usa el día UTC", () => {
    expect(localDateString(eveningEcuadorUtc, 0)).toBe("2026-06-11");
  });

  it("localDateString con tz=-540 (Tokio UTC+9): madrugada UTC ya es el día siguiente local", () => {
    // 2026-06-10 20:00 UTC = 2026-06-11 05:00 en Tokio
    expect(localDateString(new Date("2026-06-10T20:00:00Z"), -540)).toBe(
      "2026-06-11"
    );
  });

  it("startOfLocalDay con tz=300 devuelve la medianoche local de Ecuador en UTC", () => {
    const start = startOfLocalDay(eveningEcuadorUtc, 300);
    // Medianoche del 2026-06-10 en Ecuador = 2026-06-10 05:00 UTC
    expect(start.toISOString()).toBe("2026-06-10T05:00:00.000Z");
  });

  it("parseTz acepta números válidos y descarta basura y fuera de rango", () => {
    expect(parseTz("300")).toBe(300);
    expect(parseTz(-540)).toBe(-540);
    expect(parseTz("abc")).toBe(0);
    expect(parseTz(2000)).toBe(0);
    expect(parseTz(undefined)).toBe(0);
  });
});
