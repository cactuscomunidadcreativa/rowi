/**
 * 📧 GET /api/integrations/gmail/status — estado de la conexión Gmail del usuario.
 * No devuelve tokens — solo el booleano y el email conectado.
 */
import { NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return NextResponse.json({ ok: true, connected: false });

  const conn = await prisma.integrationConnection.findFirst({
    where: { userId: auth.user.id, platform: "EMAIL", status: "connected" },
    select: { name: true, messagesSent: true },
  });

  return NextResponse.json({
    ok: true,
    connected: !!conn,
    email: conn?.name ?? null,
    messagesSent: conn?.messagesSent ?? 0,
  });
}
