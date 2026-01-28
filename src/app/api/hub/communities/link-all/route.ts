// src/app/api/hub/community/link-all/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vincula automáticamente miembros de comunidad con usuarios globales.
 */
export async function POST() {
  try {
    // 🔹 Buscar miembros sin userId
    const unlinkedMembers = await prisma.rowiCommunityUser.findMany({
      where: { userId: null },
      include: {
        rowiverseUser: true, // ⬅ email correcto
        community: { select: { name: true } },
      },
    });

    if (unlinkedMembers.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay miembros pendientes por vincular.",
        total: 0,
      });
    }

    let linked = 0;
    let notFound = 0;
    const details: any[] = [];

    // Lotes para no saturar la DB
    const batchSize = 10;

    for (let i = 0; i < unlinkedMembers.length; i += batchSize) {
      const batch = unlinkedMembers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (member) => {
          try {
            // 1️⃣ Buscar email en rowiverseUser
            let email = member.rowiverseUser?.email?.toLowerCase().trim();

            // 2️⃣ Si no hay email, buscar en EQ snapshots
            if (!email) {
              const snap = await prisma.eqSnapshot.findFirst({
                where: { memberId: member.rowiverseUserId },
                select: { email: true },
              });
              if (snap?.email) {
                email = snap.email.toLowerCase().trim();
              }
            }

            // 3️⃣ Si sigue sin email → no se puede vincular
            if (!email) {
              notFound++;
              details.push({
                memberId: member.id,
                community: member.community?.name,
                status: "❌ No tiene email disponible",
              });
              return;
            }

            // 4️⃣ Buscar usuario global real
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              notFound++;
              details.push({
                memberId: member.id,
                email,
                community: member.community?.name,
                status: "⚠️ Usuario global no existe",
              });
              return;
            }

            // 5️⃣ Vincular
            await prisma.rowiCommunityUser.update({
              where: { id: member.id },
              data: { userId: user.id },
            });

            linked++;
            details.push({
              memberId: member.id,
              email,
              userId: user.id,
              userName: user.name,
              community: member.community?.name,
              status: "✅ Vinculado correctamente",
            });
          } catch (err: any) {
            console.error("⚠️ Error procesando miembro:", member.id, err);

            details.push({
              memberId: member.id,
              community: member.community?.name,
              status: "❌ Error interno",
            });
          }
        })
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Sincronización completada.",
      totalPendientes: unlinkedMembers.length,
      vinculados: linked,
      noEncontrados: notFound,
      detalles: details,
    });
  } catch (error: any) {
    console.error("❌ Error general en link-all:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al vincular miembros" },
      { status: 500 }
    );
  }
}