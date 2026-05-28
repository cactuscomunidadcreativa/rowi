// src/lib/licensing/seats.ts
// ============================================================
// Licencias por asiento (seats) a nivel organización.
//
// Una empresa compra N licencias (Stripe quantity → Tenant.licenseCount).
// Cada MIEMBRO del tenant (Membership) consume un asiento. Cuando los
// asientos usados alcanzan los comprados, no se puede invitar/activar a
// más gente — incluido "tener Rowi en Slack".
//
// Uso típico:
//   const seat = await assertSeatAvailable(tenantId);
//   if (!seat.ok) return error(seat.reason);
// ============================================================

import { prisma } from "@/core/prisma";

export interface SeatSummary {
  /** Asientos comprados (sincronizados desde Stripe). */
  purchased: number;
  /** Asientos en uso (miembros del tenant). */
  used: number;
  /** Asientos libres (purchased - used, mínimo 0). */
  available: number;
  /** true si todavía hay asientos libres. */
  hasAvailable: boolean;
}

/**
 * Devuelve el resumen de asientos de un tenant.
 * `used` = cantidad de Memberships del tenant.
 */
export async function getSeatSummary(tenantId: string): Promise<SeatSummary> {
  const [tenant, used] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { licenseCount: true },
    }),
    prisma.membership.count({ where: { tenantId } }),
  ]);

  const purchased = tenant?.licenseCount ?? 0;
  const available = Math.max(0, purchased - used);
  return {
    purchased,
    used,
    available,
    hasAvailable: available > 0,
  };
}

export interface SeatCheck {
  ok: boolean;
  reason?: "no_seats" | "tenant_not_found";
  summary?: SeatSummary;
}

/**
 * Verifica si hay al menos un asiento libre para sumar un miembro.
 * No reserva nada — es un chequeo previo a invitar/activar.
 *
 * Nota: con licenseCount = 0 (sin plan de asientos configurado) tratamos
 * el tenant como "sin límite" para no romper flujos legacy / B2C. Si
 * querés forzar límite estricto incluso en 0, cambiá `purchased === 0`.
 */
export async function assertSeatAvailable(tenantId: string): Promise<SeatCheck> {
  const summary = await getSeatSummary(tenantId);

  // licenseCount 0 = sin esquema de asientos → no se limita.
  if (summary.purchased === 0) {
    return { ok: true, summary };
  }

  if (!summary.hasAvailable) {
    return { ok: false, reason: "no_seats", summary };
  }

  return { ok: true, summary };
}
