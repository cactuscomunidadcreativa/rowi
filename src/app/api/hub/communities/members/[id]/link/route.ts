import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json().catch(() => ({}));
    const providedUserId = body.userId as string | undefined;

    const member = await prisma.rowiCommunityUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!member)
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

    // 🔹 Si se envía un userId manualmente, lo usamos directo
    if (providedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: providedUserId } });
      if (!userExists)
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      const updated = await prisma.rowiCommunityUser.update({
        where: { id },
        data: { userId: providedUserId },
        include: { user: true, community: true },
      });

      return NextResponse.json({
        ok: true,
        message: "Vinculación manual completada.",
        member: updated,
      });
    }

    // 🔹 Si no se envía userId, usar vinculación automática por email
    let email = member.user?.email || null;
    if (!email) {
      const snapshot = await prisma.eqSnapshot.findFirst({
        where: { memberId: id },
        select: { email: true },
      });
      email = snapshot?.email || null;
    }

    if (!email)
      return NextResponse.json({ error: "No se encontró email para vincular." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Usuario global no encontrado." }, { status: 404 });

    const updated = await prisma.rowiCommunityUser.update({
      where: { id },
      data: { userId: user.id },
      include: { user: true, community: true },
    });

    return NextResponse.json({
      ok: true,
      message: "Vinculación automática completada.",
      member: updated,
    });
  } catch (err: any) {
    console.error("❌ Error al vincular miembro:", err);
    return NextResponse.json({ error: "Error al vincular miembro" }, { status: 500 });
  }
}