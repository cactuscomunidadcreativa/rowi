/**
 * Beta gating para la vista multi-contexto de Vital Signs.
 *
 * Mientras inferimos OVS/TVS/FVS desde EqSnapshot+TalentSnapshot de los
 * miembros (en lugar de tener ground truth desde CSV oficial), la vista
 * agregada se expone solo a tenants beta. La lista vive en código a
 * propósito: pasar a Tenant.meta.betaFeatures cuando quepa una segunda
 * feature beta.
 */
import { prisma } from "@/core/prisma";

export const BETA_MULTI_CTX_TENANT_SLUGS = ["six-seconds"] as const;

export async function userHasBetaMultiContext(userId: string): Promise<boolean> {
  const m = await prisma.membership.findFirst({
    where: {
      userId,
      tenant: { slug: { in: BETA_MULTI_CTX_TENANT_SLUGS as unknown as string[] } },
    },
    select: { id: true },
  });
  return !!m;
}
