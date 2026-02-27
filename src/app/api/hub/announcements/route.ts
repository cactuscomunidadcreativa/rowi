// src/app/api/hub/announcements/route.ts
// CRUD para anuncios del hub usando NotificationQueue con type HUB_ANNOUNCEMENT
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

/**
 * GET /api/hub/announcements
 * Lista los anuncios del hub (NotificationQueue con type = HUB_ANNOUNCEMENT)
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const announcements = await prisma.notificationQueue.findMany({
      where: { type: "HUB_ANNOUNCEMENT" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(announcements);
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/announcements:", err);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/hub/announcements
 * Crea un nuevo anuncio
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { tenantId, title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Título y contenido requeridos" }, { status: 400 });
    }

    const announcement = await prisma.notificationQueue.create({
      data: {
        userId: auth.userId!,
        tenantId: tenantId || null,
        channel: "IN_APP",
        type: "HUB_ANNOUNCEMENT",
        title,
        message: content,
        status: "PENDING",
        metadata: { createdBy: auth.userId },
      },
    });

    return NextResponse.json({ ok: true, announcement });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/announcements:", err);
    return NextResponse.json({ error: err.message || "Error creando anuncio" }, { status: 500 });
  }
}

/**
 * PATCH /api/hub/announcements?id=xxx
 * Marca un anuncio como enviado/broadcast
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const updated = await prisma.notificationQueue.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, announcement: updated });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/hub/announcements:", err);
    return NextResponse.json({ error: err.message || "Error actualizando anuncio" }, { status: 500 });
  }
}
