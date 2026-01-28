import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import fs from "fs";
import path from "path";

/* =========================================================
   🧠 CRUD Páginas (GET, POST, PATCH, DELETE)
========================================================= */

/** GET — Listar todas las páginas */
export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, pages });
  } catch (err: any) {
    console.error("❌ Error GET /pages:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener páginas" }, { status: 500 });
  }
}

/** POST — Crear una nueva página */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const page = await prisma.page.create({
      data: {
        title: data.title || "Sin título",
        slug: data.slug,
        summary: data.summary || "",
        content: data.content || {},
        lang: data.lang || "es",
        visibility: data.visibility || "global",
        accessLevel: data.accessLevel || "public",
        rolesAllowed: data.rolesAllowed || [],
        tenantId: data.tenantId || null,
        superHubId: data.superHubId || null,
        organizationId: data.organizationId || null,
      },
    });
    return NextResponse.json({ ok: true, page });
  } catch (err: any) {
    console.error("❌ Error POST /pages:", err);
    return NextResponse.json({ ok: false, error: "Error al crear página" }, { status: 500 });
  }
}

/** PATCH — Editar página existente */
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.id) return NextResponse.json({ ok: false, error: "Falta ID" }, { status: 400 });

    const updated = await prisma.page.update({
      where: { id: data.id },
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        components: data.components,
        theme: data.theme,
        aiConfig: data.aiConfig,
        seo: data.seo,
        lang: data.lang,
        visibility: data.visibility,
        accessLevel: data.accessLevel,
        rolesAllowed: data.rolesAllowed,
        published: data.published,
      },
    });

    return NextResponse.json({ ok: true, page: updated });
  } catch (err: any) {
    console.error("❌ Error PATCH /pages:", err);
    return NextResponse.json({ ok: false, error: "Error al actualizar página" }, { status: 500 });
  }
}

/** DELETE — Eliminar página */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });

    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Página eliminada" });
  } catch (err: any) {
    console.error("❌ Error DELETE /pages:", err);
    return NextResponse.json({ ok: false, error: "Error al eliminar página" }, { status: 500 });
  }
}

/* =========================================================
   ⚙️ POST /api/admin/pages/scan — Escanea page.tsx reales
========================================================= */
export async function POST_scan() {
  try {
    const pagesDir = path.resolve(process.cwd(), "src/app");
    const results: { slug: string; title: string; summary?: string }[] = [];

    function walk(dir: string) {
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file === "page.tsx") {
          const relative = path.relative(pagesDir, fullPath);
          const slug = "/" + relative.replace("/page.tsx", "").replace(/\\/g, "/");
          const source = fs.readFileSync(fullPath, "utf8");

          const title =
            source.match(/<h1.*?>(.*?)<\/h1>/)?.[1] ||
            source.match(/title:\s*["'`](.*?)["'`]/)?.[1] ||
            path.basename(path.dirname(fullPath));

          const summary =
            source.match(/description:\s*["'`](.*?)["'`]/)?.[1] ||
            source.match(/\/\*\s*(.*?)\s*\*\//)?.[1] ||
            null;

          results.push({ slug, title, summary: summary || null });
        }
      }
    }

    walk(pagesDir);

    let created = 0;
    let updated = 0;

    for (const r of results) {
      const existing = await prisma.page.findFirst({ where: { slug: r.slug } });
      if (!existing) {
        await prisma.page.create({
          data: {
            slug: r.slug,
            title: r.title,
            summary: r.summary || "",
            lang: "es",
            visibility: "global",
            accessLevel: "public",
            published: true,
          },
        });
        created++;
      } else {
        await prisma.page.update({
          where: { id: existing.id },
          data: {
            title: r.title,
            summary: r.summary || existing.summary,
            updatedAt: new Date(),
          },
        });
        updated++;
      }
    }

    return NextResponse.json({ ok: true, created, updated, total: results.length });
  } catch (err: any) {
    console.error("❌ Error SCAN /pages:", err);
    return NextResponse.json({ ok: false, error: "Error al escanear páginas" }, { status: 500 });
  }
}