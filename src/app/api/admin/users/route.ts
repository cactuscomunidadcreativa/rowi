import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

/* =========================================================
   🧠 GET — Listar usuarios (paginación + búsqueda)
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const baseWhere = auth
      ? auth.organizationRole === "ADMIN"
        ? { primaryTenantId: auth.primaryTenantId }
        : {}
      : {};

    const where = q
      ? {
          AND: [
            baseWhere,
            {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ],
        }
      : baseWhere;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true, priceUsd: true } },
          primaryTenant: { select: { id: true, name: true, slug: true } },

          memberships: {
            include: {
              tenant: { select: { id: true, name: true } },
              plan: { select: { id: true, name: true } },
            },
          },

          orgMemberships: {
            include: {
              organization: { select: { id: true, name: true } },
            },
          },

          // 🔥 FIX FINAL: SuperHub aparece en el panel
          hubMemberships: {
            include: {
              hub: {
                include: {
                  superHub: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      colorTheme: true,
                    },
                  },
                },
              },
            },
          },

          // 📊 SEI Data - Include latest snapshot
          eqSnapshots: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              K: true,
              C: true,
              G: true,
              overall4: true,
              brainStyle: true,
              recentMood: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/users:", err);
    return NextResponse.json(
      { ok: false, error: "Error al listar usuarios" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo usuario
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const { name, email, tenantId, planId } = await req.json();

    if (!email || !name)
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios (nombre o email)" },
        { status: 400 }
      );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json(
        { ok: false, error: "El usuario ya existe" },
        { status: 409 }
      );

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        primaryTenantId: tenantId || null,
        planId: planId || null,
        organizationRole: "VIEWER",
        active: true,
        allowAI: true,
      },
      include: {
        primaryTenant: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "✅ Usuario creado correctamente",
      user,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/users:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al crear usuario" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Editar usuario (actualización completa)
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);
    if (!auth)
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );

    const body = await req.json();
    const {
      id,
      name,
      email,
      organizationRole,
      primaryTenantId,
      planId,
      allowAI,
      active,
      // New hierarchy fields
      organizationId,
      superHubId,
      hubId,
    } = body;

    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del usuario" },
        { status: 400 }
      );

    // Start a transaction to handle all updates
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update basic user data
      const user = await tx.user.update({
        where: { id },
        data: {
          name,
          email: email?.toLowerCase(),
          organizationRole,
          primaryTenantId: primaryTenantId || null,
          planId: planId || null,
          allowAI: allowAI ?? true,
          active: active ?? true,
        },
        include: {
          plan: { select: { id: true, name: true, priceUsd: true } },
          primaryTenant: { select: { id: true, name: true } },
        },
      });

      // 2. Handle organization membership if organizationId changed
      if (organizationId !== undefined) {
        // Remove existing org memberships
        await tx.orgMembership.deleteMany({ where: { userId: id } });

        // Add new org membership if provided
        if (organizationId) {
          await tx.orgMembership.create({
            data: {
              userId: id,
              organizationId,
              role: "MEMBER",
            },
          });
        }
      }

      // 3. Handle hub membership if hubId changed
      if (hubId !== undefined) {
        // Remove existing hub memberships
        await tx.hubMembership.deleteMany({ where: { userId: id } });

        // Add new hub membership if provided
        if (hubId) {
          await tx.hubMembership.create({
            data: {
              userId: id,
              hubId,
              role: "MEMBER",
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json({
      ok: true,
      message: "✅ Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/users:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar usuario
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);
    if (!auth)
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );

    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del usuario" },
        { status: 400 }
      );

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "🗑️ Usuario eliminado correctamente",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/users:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}