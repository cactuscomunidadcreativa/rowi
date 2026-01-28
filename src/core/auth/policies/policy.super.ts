// src/core/auth/policies/policy.super.ts
import { prisma } from "../../prisma";

/**
 * Determina si un usuario es SUPERADMIN GLOBAL del RowiVerse.
 * 
 * Reglas:
 * - Al menos un permiso con role = "superadmin"
 * - scopeType = "rowiverse"
 * - scopeId puede ser el rowiverse_root o cualquier rowiverse registrado
 */
export async function isSuperAdmin(userId: string) {
  if (!userId) return false;

  // Buscar cualquier RowiVerse permitido
  const rowiVerses = await prisma.rowiVerse.findMany({
    select: { id: true },
  });

  const allowedIds = rowiVerses.map((v) => v.id);

  const perm = await prisma.userPermission.findFirst({
    where: {
      userId,
      role: "superadmin",
      scopeType: "rowiverse",
      scopeId: { in: allowedIds },
    },
  });

  return !!perm;
}