import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/**
 * 🔗 POST — Merge/Unir dos usuarios
 *
 * Transfiere todos los datos del usuario origen (sourceId) al destino (targetId)
 * y luego elimina el usuario origen.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const { sourceId, targetId } = await req.json();

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { ok: false, error: "Faltan sourceId o targetId" },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { ok: false, error: "No puedes unir un usuario consigo mismo" },
        { status: 400 }
      );
    }

    // Verificar que ambos usuarios existen
    const [source, target] = await Promise.all([
      prisma.user.findUnique({ where: { id: sourceId } }),
      prisma.user.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) {
      return NextResponse.json(
        { ok: false, error: "Usuario origen no encontrado" },
        { status: 404 }
      );
    }

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Usuario destino no encontrado" },
        { status: 404 }
      );
    }

    // Transferir datos relacionados del source al target
    // Usamos transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // 1. EqSnapshots
      await tx.eqSnapshot.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 2. CommunityMembers - actualizar userId
      await tx.communityMember.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 3. Memberships (tenant)
      await tx.membership.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 4. OrgMemberships
      await tx.orgMembership.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 5. HubMemberships
      await tx.hubMembership.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 6. RowiChats
      await tx.rowiChat.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 7. ActivityLogs
      await tx.activityLog.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 8. UserPermissions
      await tx.userPermission.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 9. AffinitySnapshots
      await tx.affinitySnapshot.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 10. EmotionalEvents
      await tx.emotionalEvent.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 11. Sessions (auth)
      await tx.session.deleteMany({
        where: { userId: sourceId },
      });

      // 12. Accounts (OAuth)
      await tx.account.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 13. RowiCommunityUser
      await tx.rowiCommunityUser.updateMany({
        where: { userId: sourceId },
        data: { userId: targetId },
      });

      // 14. AvatarEvolution
      const sourceAvatar = await tx.avatarEvolution.findUnique({
        where: { userId: sourceId },
      });
      if (sourceAvatar) {
        const targetAvatar = await tx.avatarEvolution.findUnique({
          where: { userId: targetId },
        });
        if (!targetAvatar) {
          // Mover el avatar al target
          await tx.avatarEvolution.update({
            where: { userId: sourceId },
            data: { userId: targetId },
          });
        } else {
          // Eliminar el avatar del source si el target ya tiene uno
          await tx.avatarEvolution.delete({
            where: { userId: sourceId },
          });
        }
      }

      // Finalmente, eliminar el usuario origen
      await tx.user.delete({
        where: { id: sourceId },
      });
    });

    return NextResponse.json({
      ok: true,
      message: `✅ Usuario ${source.email} unido correctamente a ${target.email}`,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/users/merge:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al unir usuarios" },
      { status: 500 }
    );
  }
}
