// src/lib/communities/propagate-member.ts
import { prisma } from "@/core/prisma";

/**
 * =========================================================
 * 🔗 propagateMemberToParents
 * ---------------------------------------------------------
 * Cuando un usuario es agregado a una sub-comunidad,
 * esta función lo agrega automáticamente a TODAS las
 * comunidades padre en la cadena jerárquica.
 *
 * Ejemplo:
 *   Global Office (sub) → Six Seconds Global (padre)
 *   Si agregas a Juan a Global Office, también se agrega
 *   automáticamente a Six Seconds Global.
 *
 * - Usa upsert para evitar duplicados
 * - Propaga hasta 10 niveles como máximo (safety)
 * - El rol en comunidades padre es siempre "member"
 *   (independiente del rol en la sub-comunidad)
 * =========================================================
 */
export async function propagateMemberToParents({
  communityId,
  userId,
  rowiverseUserId,
  email,
  name,
  language,
}: {
  communityId: string;
  userId: string;
  rowiverseUserId?: string | null;
  email?: string | null;
  name?: string | null;
  language?: string | null;
}): Promise<{ propagated: number; communities: string[] }> {
  const propagatedTo: string[] = [];
  let currentCommunityId = communityId;
  let depth = 0;
  const MAX_DEPTH = 10; // Safety: máximo 10 niveles de jerarquía

  while (depth < MAX_DEPTH) {
    // Buscar la comunidad actual y su padre
    const community = await prisma.rowiCommunity.findUnique({
      where: { id: currentCommunityId },
      select: { superId: true, name: true },
    });

    // Si no tiene padre, terminamos
    if (!community?.superId) break;

    const parentId = community.superId;

    // Crear membresía en la comunidad padre (si no existe)
    await prisma.rowiCommunityUser.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId: parentId,
        },
      },
      update: {}, // Si ya existe, no modificar nada
      create: {
        userId,
        communityId: parentId,
        rowiverseUserId: rowiverseUserId || null,
        email: email || null,
        name: name || null,
        role: "member",
        status: "active",
        language: language || "es",
      },
    });

    propagatedTo.push(parentId);

    // Subir al siguiente nivel
    currentCommunityId = parentId;
    depth++;
  }

  if (propagatedTo.length > 0) {
    console.log(
      `🔗 Propagado miembro ${userId} a ${propagatedTo.length} comunidades padre`
    );
  }

  return {
    propagated: propagatedTo.length,
    communities: propagatedTo,
  };
}
