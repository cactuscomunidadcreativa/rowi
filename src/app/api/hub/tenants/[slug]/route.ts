import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

function normSlug(s?: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// GET: un tenant (incluye plan)
export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { plan: { select: { id: true, name: true } } },
    });
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (err: any) {
    console.error("[GET /tenants/[slug]]", err);
    return NextResponse.json({ error: "Error fetching tenant" }, { status: 500 });
  }
}

// PATCH: editar name, slug, planId, billingEmail
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: oldSlug } = await ctx.params;

    const body = await req.json().catch(() => ({} as any));
    const updates: Record<string, any> = {};

    // name
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    // billingEmail (permitir null)
    if (typeof body.billingEmail === "string") {
      updates.billingEmail = body.billingEmail.trim() || null;
    }

    // planId (permitir quitar plan si viene vacío / null)
    if (body.planId === "" || body.planId == null) {
      updates.planId = null;
    } else if (typeof body.planId === "string") {
      updates.planId = body.planId;
    }

    // slug (normalizado, validado y no duplicado)
    if (typeof body.slug === "string") {
      const newSlug = normSlug(body.slug);
      if (!newSlug) {
        return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
      }
      if (newSlug !== oldSlug) {
        const exists = await prisma.tenant.findUnique({ where: { slug: newSlug } });
        if (exists) {
          return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
        }
        updates.slug = newSlug;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { slug: oldSlug },
      data: updates,
      include: { plan: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /tenants/[slug]]", err);
    return NextResponse.json({ error: "Error actualizando tenant" }, { status: 500 });
  }
}