/**
 * 🧩 API: Plans Management
 * GET /api/admin/plans - Listar todos los planes
 * POST /api/admin/plans - Crear nuevo plan
 * PATCH /api/admin/plans - Actualizar plan
 * DELETE /api/admin/plans - Eliminar plan
 *
 * ⚠️ PROTEGIDO: Solo accesible para administradores del sistema
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { logPlanChange } from "@/lib/audit/auditLog";

export const dynamic = "force-dynamic";

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

// =========================================================
// GET — Listar todos los Planes
// =========================================================
export async function GET(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const publicOnly = searchParams.get("publicOnly") === "true";

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (publicOnly) {
      where.isPublic = true;
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            memberships: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      total: plans.length,
      plans,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error cargando planes: " + err.message },
      { status: 500 }
    );
  }
}

// =========================================================
// POST — Crear un nuevo Plan
// =========================================================
export async function POST(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      priceUsd,
      priceCents,
      durationDays,
      aiEnabled,
      // Stripe
      stripePriceIdMonthly,
      stripeProductId,
      // Trial
      trialDays,
      // Features
      seiIncluded,
      maxCommunities,
      maxMembers,
      maxUsers,
      benchmarkAccess,
      apiAccess,
      // Display
      badge,
      sortOrder,
      isPublic,
      isActive,
    } = body;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "El campo 'name' es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar nombre único
    const existingByName = await prisma.plan.findUnique({ where: { name } });
    if (existingByName) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un plan con ese nombre" },
        { status: 409 }
      );
    }

    // Verificar slug único si se proporciona
    if (slug) {
      const existingBySlug = await prisma.plan.findUnique({ where: { slug } });
      if (existingBySlug) {
        return NextResponse.json(
          { ok: false, error: "Ya existe un plan con ese slug" },
          { status: 409 }
        );
      }
    }

    // Generar slug si no se proporciona
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const created = await prisma.plan.create({
      data: {
        name,
        slug: finalSlug,
        description: description || "",
        priceUsd: Number(priceUsd) || 0,
        priceCents: Number(priceCents) || 0,
        durationDays: Number(durationDays) || 30,
        aiEnabled: aiEnabled ?? true,
        // Stripe
        stripePriceIdMonthly: stripePriceIdMonthly || null,
        stripeProductId: stripeProductId || null,
        // Trial
        trialDays: Number(trialDays) || 0,
        // Features
        seiIncluded: seiIncluded ?? false,
        maxCommunities: Number(maxCommunities) || 1,
        maxMembers: Number(maxMembers) || 10,
        maxUsers: Number(maxUsers) || 1,
        benchmarkAccess: benchmarkAccess ?? false,
        apiAccess: apiAccess ?? false,
        // Display
        badge: badge || null,
        sortOrder: Number(sortOrder) || 0,
        isPublic: isPublic ?? true,
        isActive: isActive ?? true,
      },
    });

    // 📝 Log de auditoría
    await logPlanChange(
      session.user.id || null,
      created.id,
      "PLAN_CREATED",
      { name, slug: finalSlug, priceUsd, priceCents },
      req
    );

    return NextResponse.json({
      ok: true,
      message: "Plan creado correctamente",
      plan: created,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear el plan: " + err.message },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH — Editar un Plan existente
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID del plan" },
        { status: 400 }
      );
    }

    // Verificar que el plan existe
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    // Verificar nombre único si se cambia
    if (data.name && data.name !== existing.name) {
      const existingByName = await prisma.plan.findUnique({
        where: { name: data.name },
      });
      if (existingByName) {
        return NextResponse.json(
          { ok: false, error: "Ya existe un plan con ese nombre" },
          { status: 409 }
        );
      }
    }

    // Verificar slug único si se cambia
    if (data.slug && data.slug !== existing.slug) {
      const existingBySlug = await prisma.plan.findUnique({
        where: { slug: data.slug },
      });
      if (existingBySlug) {
        return NextResponse.json(
          { ok: false, error: "Ya existe un plan con ese slug" },
          { status: 409 }
        );
      }
    }

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priceUsd !== undefined) updateData.priceUsd = Number(data.priceUsd);
    if (data.priceCents !== undefined) updateData.priceCents = Number(data.priceCents);
    if (data.durationDays !== undefined) updateData.durationDays = Number(data.durationDays);
    if (data.aiEnabled !== undefined) updateData.aiEnabled = data.aiEnabled;
    // Stripe
    if (data.stripePriceIdMonthly !== undefined) updateData.stripePriceIdMonthly = data.stripePriceIdMonthly;
    if (data.stripeProductId !== undefined) updateData.stripeProductId = data.stripeProductId;
    // Trial
    if (data.trialDays !== undefined) updateData.trialDays = Number(data.trialDays);
    // Features
    if (data.seiIncluded !== undefined) updateData.seiIncluded = data.seiIncluded;
    if (data.maxCommunities !== undefined) updateData.maxCommunities = Number(data.maxCommunities);
    if (data.maxMembers !== undefined) updateData.maxMembers = Number(data.maxMembers);
    if (data.maxUsers !== undefined) updateData.maxUsers = Number(data.maxUsers);
    if (data.benchmarkAccess !== undefined) updateData.benchmarkAccess = data.benchmarkAccess;
    if (data.apiAccess !== undefined) updateData.apiAccess = data.apiAccess;
    // Display
    if (data.badge !== undefined) updateData.badge = data.badge;
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // 📝 Log de auditoría
    await logPlanChange(
      session.user.id || null,
      id,
      "PLAN_UPDATED",
      { previousValues: existing, newValues: updateData },
      req
    );

    return NextResponse.json({
      ok: true,
      message: "Plan actualizado correctamente",
      plan: updated,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el plan: " + err.message },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — Eliminar un Plan
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID del plan" },
        { status: 400 }
      );
    }

    // Verificar que no hay usuarios con este plan
    const usersWithPlan = await prisma.user.count({
      where: { planId: id },
    });

    if (usersWithPlan > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se puede eliminar: ${usersWithPlan} usuarios tienen este plan. Desactívalo en su lugar.`,
        },
        { status: 400 }
      );
    }

    // Obtener plan antes de eliminar para log
    const planToDelete = await prisma.plan.findUnique({ where: { id } });

    await prisma.plan.delete({ where: { id } });

    // 📝 Log de auditoría
    await logPlanChange(
      session.user.id || null,
      id,
      "PLAN_DELETED",
      { deletedPlan: planToDelete?.name },
      req
    );

    return NextResponse.json({
      ok: true,
      message: "Plan eliminado correctamente",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el plan: " + err.message },
      { status: 500 }
    );
  }
}
