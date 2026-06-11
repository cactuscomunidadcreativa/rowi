/**
 * Reclama una invitación relacional tras crear cuenta (F4 · Rowi Launch 1.0).
 *
 * Cierra el eslabón que faltaba en la cadena SIA: el invitado respondía el
 * mini-test y aceptaba, pero al registrarse el token no viajaba y
 * `dyad.otherUserId` no se escribía NUNCA en este flujo (auditoría jun-2026,
 * flujo D) — la relación quedaba huérfana y el efecto red no se disparaba.
 *
 * Idempotente y no crítico: cualquier fallo se loguea y no rompe el registro.
 */
import { prisma } from "@/core/prisma";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

export async function claimRelationshipInvite(
  token: string,
  userId: string,
): Promise<boolean> {
  try {
    const invite = await prisma.relationshipInvite.findUnique({
      where: { token },
      select: {
        id: true,
        dyadId: true,
        inviterUserId: true,
        acceptedUserId: true,
        expiresAt: true,
      },
    });
    if (!invite) return false;
    // Expirada pero respondida: igual vinculamos — el dato del invitado ya
    // existe en la díada y el vínculo es lo que el owner pidió.
    if (invite.acceptedUserId && invite.acceptedUserId !== userId) return false;
    if (invite.inviterUserId === userId) return false; // no auto-vincular

    await prisma.$transaction([
      prisma.relationshipInvite.update({
        where: { id: invite.id },
        data: { acceptedUserId: userId },
      }),
      prisma.relationshipDyad.update({
        where: { id: invite.dyadId },
        data: { otherUserId: userId, otherJoined: true },
      }),
    ]);

    await trackFunnel("rel_invite_linked", {
      userId,
      details: { dyadId: invite.dyadId },
    });
    return true;
  } catch (e) {
    console.warn("[claimRelationshipInvite] no crítico:", e);
    return false;
  }
}
