/**
 * Cycle detection para la línea de reporte de EmployeeProfile.
 *
 * Extraído de src/app/api/admin/hr/employees/[id]/route.ts para reuso en:
 *   - PATCH /api/admin/hr/employees/[id]    (admin edit)
 *   - PATCH /api/account/employee-profile   (self-declared manager via onboarding)
 *
 * Camina hacia arriba la cadena de managers desde el candidato. Si en algún
 * punto encuentra el employee que intenta asignar, hay ciclo. El `seen` set
 * es una red de seguridad por si los datos ya tienen un ciclo previo —
 * cortamos antes de un loop infinito.
 */

import { prisma } from "@/core/prisma";

/**
 * Detecta si asignar `candidateManagerId` como manager de `employeeId`
 * crearía un ciclo en la jerarquía de reporte.
 *
 * @returns true si crearía ciclo (la operación debe rechazarse).
 */
export async function wouldCreateCycle(
  employeeId: string,
  candidateManagerId: string,
): Promise<boolean> {
  if (employeeId === candidateManagerId) return true;
  let cursor: string | null = candidateManagerId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === employeeId) return true;
    if (seen.has(cursor)) return true; // safety
    seen.add(cursor);
    const node: { managerId: string | null } | null =
      await prisma.employeeProfile.findUnique({
        where: { id: cursor },
        select: { managerId: true },
      });
    cursor = node?.managerId ?? null;
  }
  return false;
}
