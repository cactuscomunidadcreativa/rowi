import { prisma } from "@/core/prisma";

/**
 * 🔍 findUserByEmail
 * ---------------------------------------------------------
 * Busca un usuario en base a su dirección de email,
 * considerando el nuevo modelo con relación `UserEmail[]`.
 * 
 * - Retorna el usuario completo (con emails, plan, tenant, etc.)
 * - Si no existe, retorna `null`
 * - Puede filtrar por `select` o `include` personalizados
 */
export async function findUserByEmail(
  email: string,
  opts?: {
    include?: any;
    select?: any;
  }
) {
  if (!email) return null;

  // Prisma rejects passing both `include` and `select` — switch based
  // on which the caller asked for, defaulting to a standard include.
  const where = {
    emails: {
      some: {
        // Was `email.toLowerCase` (method reference, not a call).
        email: email.toLowerCase(),
      },
    },
  };

  if (opts?.select) {
    const user = await prisma.user.findFirst({
      where,
      select: opts.select,
    });
    return user;
  }

  const user = await prisma.user.findFirst({
    where,
    include: opts?.include ?? {
      emails: true,
      primaryTenant: true,
      plan: true,
    },
  });
  return user;
}