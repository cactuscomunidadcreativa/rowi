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

  const user = await prisma.user.findFirst({
    where: {
      emails: {
        some: {
          email: email.toLowerCase
        }
      }
    },
    include: opts?.include ?? {
      emails: true,
      primaryTenant: true,
      plan: true
    },
    select: opts?.select
  });

  return user;
}