// src/app/api/hub/hubs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   🧠 GET → Listar todos los hubs
========================================================= */
export async function GET() {
  try {
    const hubs = await prisma.hub.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, total: hubs.length, hubs });
  } catch (e: any) {
    console.error("❌ Error GET /api/hub/hubs:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/* =========================================================
   ➕ POST → Crear nuevo hub asociado a un tenant
   - Crea slug automático si falta
   - Sincroniza agentes globales tras la creación
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const body = await req.json();
    const {
      tenantId,
      name,
      slug: rawSlug,
      description = "",
      visibility = "private",
    } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos (tenantId, name)" },
        { status: 400 }
      );
    }

    // 🧠 Generar slug automáticamente si no viene
    const slug = rawSlug
      ? rawSlug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // 🚫 Validar que el slug no exista
    const existing = await prisma.hub.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "El slug ya existe, elige otro." },
        { status: 409 }
      );
    }

    // ✅ Crear el Hub
    const hub = await prisma.hub.create({
      data: {
        tenantId,
        name,
        slug,
        description,
        visibility,
      },
    });

    console.log(`🧱 Nuevo Hub creado: ${hub.name} (${hub.slug})`);

    // ⚙️ Sincronizar agentes globales automáticamente para este Tenant
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${apiUrl}/api/hub/agents/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "tenant",
          scopeId: tenantId,
        }),
      });
      console.log(`🤖 Agentes sincronizados para el Tenant ${tenantId}`);
    } catch (err: any) {
      console.warn("⚠️ No se pudieron sincronizar los agentes globales:", err);
    }

    return NextResponse.json({ ok: true, hub });
  } catch (e: any) {
    console.error("❌ Error POST /api/hub/hubs:", e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE → Eliminar hub
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ ok: false, error: "Falta el ID del hub" });

    await prisma.hub.delete({ where: { id } });
    return NextResponse.json({
      ok: true,
      message: "Hub eliminado correctamente",
    });
  } catch (e: any) {
    console.error("❌ Error DELETE /api/hub/hubs:", e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";