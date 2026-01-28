// src/app/api/hub/maintenance/sync-users/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function syncUsers() {
  let created = 0;

  const members = await prisma.rowiCommunityUser.findMany({
    include: { user: true, community: true },
  });

  for (const member of members) {
    if (!member.userId || !member.user) {
      const snapshot = await prisma.eqSnapshot.findFirst({
        where: { memberId: member.id },
        select: { name: true, email: true },
      });

      const email = snapshot?.email?.trim()?.toLowerCase();
      if (!email) continue;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: snapshot?.name || "Usuario Comunidad",
            active: true,
          },
        });
        created++;
      }

      await prisma.rowiCommunityUser.update({
        where: { id: member.id },
        data: { userId: user.id },
      });
    }
  }

  return created;
}

export async function POST() {
  try {
    const created = await syncUsers();
    return NextResponse.json({
      ok: true,
      message: `Sincronización completada: ${created} usuarios creados.`,
    });
  } catch (err: any) {
    console.error("❌ Error al sincronizar usuarios:", err);
    return NextResponse.json(
      { error: "Error al sincronizar usuarios" },
      { status: 500 }
    );
  }
}

// para pruebas rápidas desde navegador
export async function GET() {
  return POST();
}