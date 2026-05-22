/**
 * Helpers de timezone para Daily Pulse.
 *
 * El servidor recibe `tzOffsetMinutes` del cliente (Date.getTimezoneOffset())
 * — positivo para zonas detrás de UTC (Ecuador UTC-5 → 300), negativo para
 * zonas adelante (Tokyo UTC+9 → -540). El "día local" del usuario es el
 * día UTC del instante (now - offset).
 *
 * Si el cliente no envía offset, se asume UTC (offset 0).
 */

/** Inicio del día LOCAL del usuario (en wall-clock), devuelto como UTC Date. */
export function startOfLocalDay(
  now: Date,
  tzOffsetMinutes: number,
): Date {
  const localNow = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const localDay = new Date(
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()),
  );
  // Convertir back a UTC sumando el offset.
  return new Date(localDay.getTime() + tzOffsetMinutes * 60_000);
}

/** dayOfYear en TZ local del usuario, para rotar la pregunta del día. */
export function localDayOfYear(now: Date, tzOffsetMinutes: number): number {
  const localNow = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const start = new Date(Date.UTC(localNow.getUTCFullYear(), 0, 0));
  const diff = localNow.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Parsea tzOffsetMinutes desde un parámetro string-or-number. */
export function parseTz(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  // Sanity bound: no más de ±14h (mundo real cubre ±12 + DST).
  if (n < -840 || n > 840) return 0;
  return Math.round(n);
}
