/**
 * Gate de pertenencia para los endpoints del consultor (F6 · Rowi Launch 1.0).
 *
 * Cierra el IDOR cross-tenant de la auditoría jun-2026: los 6 endpoints
 * /api/consultant/* /[benchmarkId] solo verificaban la capability y luego
 * consultaban por benchmarkId directo — un consultor de un tenant podía leer
 * benchmarks de cualquier otro adivinando/iterando ids.
 *
 * Regla (patrón "read scope-aware" de CLAUDE.md):
 *  - rowiverse (SuperAdmin): sin narrowing.
 *  - resto de scopes: el benchmark debe pertenecer a un tenant del scope.
 *  - benchmark sin tenant (plataforma/global): solo rowiverse.
 */
import { prisma } from "@/core/prisma";
import { tenantIdsForScope } from "@/core/admin/scopedList";
import type { AdminScope } from "@/core/auth/requireAdmin";

export async function benchmarkInScope(
  benchmarkId: string,
  scope: AdminScope,
): Promise<boolean> {
  const ids = await tenantIdsForScope(scope);
  if (ids === null) return true; // rowiverse

  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    select: { tenantId: true },
  });
  if (!benchmark) return false;
  if (!benchmark.tenantId) return false; // global → solo rowiverse
  return ids.includes(benchmark.tenantId);
}
