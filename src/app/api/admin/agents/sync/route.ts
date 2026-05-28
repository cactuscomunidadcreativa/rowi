// src/app/api/admin/agents/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * POST /api/admin/agents/sync
 * ---------------------------------------------------------
 * Distribuye los agentes GLOBAL base a cada entidad (tenant / superhub / hub /
 * org) como copias INDEPENDIENTES, para que cada una pueda personalizar su
 * prompt y su cultura. Idempotente: solo crea los que faltan (dedup slug+scope).
 *
 * - PLATFORM_SLUGS (p.ej. "research") NO se distribuyen: son agentes de
 *   plataforma y viven solo en global (evita la explosión de copias).
 * - Limpia copias con scope de los PLATFORM_SLUGS dejadas por versiones previas.
 *
 * Nota: el resolver del chat usa hub → tenant → superhub → global (no org), así
 * que los agentes de org hoy se personalizan/ven en admin pero no se sirven en
 * el chat hasta cablear la resolución por organización.
 */
const PLATFORM_SLUGS = new Set(["research"]);

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const globalAgents = await prisma.agentConfig.findMany({
      where: { tenantId: null, superHubId: null, hubId: null, organizationId: null },
    });
    if (globalAgents.length === 0) {
      return NextResponse.json({ ok: false, message: "⚠️ No hay agentes globales base." });
    }

    // 🧹 Limpieza: los agentes de plataforma (research) solo deben existir como
    // global. Borra cualquier copia con scope creada por syncs antiguos.
    const cleaned = await prisma.agentConfig.deleteMany({
      where: {
        slug: { in: [...PLATFORM_SLUGS] },
        OR: [
          { tenantId: { not: null } },
          { superHubId: { not: null } },
          { hubId: { not: null } },
          { organizationId: { not: null } },
        ],
      },
    });

    // Agentes distribuibles = globales que NO son de plataforma.
    const distributable = globalAgents.filter((a) => !PLATFORM_SLUGS.has(a.slug));

    const [tenants, superHubs, hubs, orgs] = await Promise.all([
      prisma.tenant.findMany({ select: { id: true } }),
      prisma.superHub.findMany({ select: { id: true } }),
      prisma.hub.findMany({ select: { id: true } }),
      prisma.organization.findMany({ select: { id: true } }),
    ]);

    let created = 0;
    let skipped = 0;

    const targets: { scope: "tenant" | "superhub" | "hub" | "organization"; id: string }[] = [
      ...tenants.map((t) => ({ scope: "tenant" as const, id: t.id })),
      ...superHubs.map((s) => ({ scope: "superhub" as const, id: s.id })),
      ...hubs.map((h) => ({ scope: "hub" as const, id: h.id })),
      ...orgs.map((o) => ({ scope: "organization" as const, id: o.id })),
    ];

    for (const { scope, id } of targets) {
      for (const base of distributable) {
        const exists = await prisma.agentConfig.findFirst({
          where: {
            slug: base.slug,
            tenantId: scope === "tenant" ? id : undefined,
            superHubId: scope === "superhub" ? id : undefined,
            hubId: scope === "hub" ? id : undefined,
            organizationId: scope === "organization" ? id : undefined,
          },
        });
        if (exists) {
          skipped++;
          continue;
        }
        await prisma.agentConfig.create({
          data: {
            slug: base.slug,
            name: base.name,
            description: base.description,
            type: base.type,
            model: base.model,
            prompt: base.prompt,
            tone: base.tone,
            tools: base.tools ?? undefined,
            accessLevel: base.accessLevel,
            visibility: base.visibility,
            autoLearn: base.autoLearn,
            isActive: true,
            tenantId: scope === "tenant" ? id : null,
            superHubId: scope === "superhub" ? id : null,
            hubId: scope === "hub" ? id : null,
            organizationId: scope === "organization" ? id : null,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `🤖 Sincronización completada: ${created} agentes distribuidos, ${skipped} ya existían, ${cleaned.count} copias de plataforma limpiadas.`,
      created,
      skipped,
      cleaned: cleaned.count,
      distributable: distributable.length,
      targets: targets.length,
    });
  } catch (error: any) {
    console.error("❌ Error en /api/admin/agents/sync:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
