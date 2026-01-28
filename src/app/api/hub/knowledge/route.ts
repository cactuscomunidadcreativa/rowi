// src/app/api/hub/knowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { OpenAI } from "openai";

export const runtime = "nodejs";

/* =========================================================
   ⚙️ CONFIGURACIÓN IA
   ========================================================= */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const summarizePrompt = (title: string, content?: string, url?: string) => `
Eres el asistente de conocimiento central de Rowi.
Tu tarea es analizar y resumir el siguiente recurso, en tono emocionalmente inteligente,
destacando su relevancia práctica para el aprendizaje organizacional.

Título: ${title}
${url ? `Fuente: ${url}` : ""}
${content ? `Contenido:\n${content.slice(0, 1000)}` : ""}
Devuelve un párrafo de máximo 5 líneas, con lenguaje humano y profesional.
`;

/* =========================================================
   🧩 GET — LISTAR RECURSOS COMPLETOS
   ========================================================= */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const hubId = url.searchParams.get("hubId");
    const tenantId = url.searchParams.get("tenantId");
    const superHubId = url.searchParams.get("superHubId");
    const q = url.searchParams.get("q");

    const where: any = {};
    if (hubId) where.hubId = hubId;
    if (tenantId) where.tenantId = tenantId;
    if (superHubId) where.superHubId = superHubId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" as const } },
        { kind: { contains: q, mode: "insensitive" as const } },
        { content: { contains: q, mode: "insensitive" as const } },
        { agents: { some: { name: { contains: q, mode: "insensitive" as const } } } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" as const } } } } },
      ];
    }

    const resources = await prisma.knowledgeResource.findMany({
      where,
      include: {
        // Jerarquía
        superHub: { select: { id: true, name: true, description: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        hub: { select: { id: true, name: true, description: true } },
        // Agentes conectados
        agents: {
          select: {
            id: true,
            name: true,
            type: true,
            model: true,
            avatar: true,
            tenant: { select: { id: true, name: true } },
            autoLearn: true,
            visibility: true,
            isActive: true,
            tone: true,
          },
        },
        // Tags y estudios relacionados
        tags: { include: { tag: true } },
        caseStudy: { select: { id: true, title: true, authorId: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 📊 Enriquecimiento de respuesta con metadatos
    const enriched = resources.map((r) => ({
      ...r,
      meta: {
        totalAgents: r.agents?.length ?? 0,
        totalTags: r.tags?.length ?? 0,
        origin:
          r.hub?.name ||
          r.tenant?.name ||
          r.superHub?.name ||
          "Global",
        lastUpdated: new Date(r.updatedAt).toLocaleString("es-PE"),
      },
    }));

    return NextResponse.json({ count: enriched.length, data: enriched }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/knowledge:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================================
   🧩 POST — CREAR NUEVO RECURSO
   ========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      url,
      kind = "insight",
      content,
      tags = [],
      hubId,
      tenantId,
      superHubId,
      agents = [],
      createdBy,
    } = body;

    if (!title) throw new Error("El título es obligatorio");

    // Evita duplicados
    const existing = await prisma.knowledgeResource.findFirst({
      where: { OR: [{ title }, { url }] },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Recurso duplicado detectado", existing },
        { status: 409 }
      );
    }

    // IA resume si no hay contenido
    let aiSummary = content;
    if (!content) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: summarizePrompt(title, content, url) }],
          temperature: 0.6,
        });
        aiSummary = completion.choices[0]?.message?.content ?? undefined;
      } catch (err: any) {
        console.warn("⚠️ Error generando resumen IA:", err);
      }
    }

    // Crear registro
    const resource = await prisma.knowledgeResource.create({
      data: {
        title,
        url,
        kind,
        content: aiSummary,
        hubId,
        tenantId,
        superHubId,
        agents: { connect: agents.map((id: string) => ({ id })) },
        tags: {
          create: tags.map((t: string) => ({
            tag: {
              connectOrCreate: { where: { name: t }, create: { name: t } },
            },
          })),
        },
        metadata: {
          source: "KnowledgeHub API",
          aiGenerated: !content,
          createdBy,
        },
      },
      include: {
        tags: { include: { tag: true } },
        agents: { select: { id: true, name: true, type: true, tenant: { select: { name: true } } } },
      },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        action: "CREATE_RESOURCE",
        entity: "KnowledgeResource",
        targetId: resource.id,
        meta: {
          createdBy,
          source: "KnowledgeHub API",
          tenant: tenantId,
          hub: hubId,
          superHub: superHubId,
        },
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/knowledge:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================================
   🧩 PATCH — ACTUALIZAR RECURSO
   ========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, kind, content, tags, agents } = body;
    if (!id) throw new Error("ID de recurso faltante");

    const updated = await prisma.knowledgeResource.update({
      where: { id },
      data: {
        title,
        kind,
        content,
        updatedAt: new Date(),
        ...(tags && {
          tags: {
            set: [],
            create: tags.map((t: string) => ({
              tag: { connectOrCreate: { where: { name: t }, create: { name: t } } },
            })),
          },
        }),
        ...(agents && {
          agents: { set: agents.map((id: string) => ({ id })) },
        }),
      },
      include: {
        tags: { include: { tag: true } },
        agents: { select: { id: true, name: true, type: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_RESOURCE",
        entity: "KnowledgeResource",
        targetId: id,
        meta: { title, kind, agents },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ Error PATCH /api/hub/knowledge:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================================
   🧩 DELETE — ELIMINAR RECURSO
   ========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("ID faltante");

    const deleted = await prisma.knowledgeResource.delete({
      where: { id },
      include: { hub: true, tenant: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_RESOURCE",
        entity: "KnowledgeResource",
        targetId: id,
        meta: {
          hub: deleted.hub?.name,
          tenant: deleted.tenant?.name,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/hub/knowledge:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}