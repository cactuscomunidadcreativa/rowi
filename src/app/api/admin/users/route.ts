import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdmin, requireSuperAdmin, canDeleteUser } from "@/lib/auth";
import { requireSuperAdmin as requireSuperAdminGuard } from "@/core/auth/requireAdmin";
import {
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  parsePagination,
  parseBody,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

/* =========================================================
   🧠 GET — Listar usuarios (paginación + búsqueda)
   ---------------------------------------------------------
   🔐 SEGURIDAD: Requiere permisos de admin
   - SuperAdmin: ve todos los usuarios
   - Admin de tenant: solo ve usuarios de su tenant
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdminGuard();
    if (auth.error) return auth.error;

    // 🔐 Verificar permisos de admin
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.error;
    const adminUser = authResult.user;

    // 🛡️ Validación de parámetros con Zod
    const url = new URL(req.url);
    const { page, limit, skip, q } = parsePagination(url.searchParams);

    // 🔐 Filtrar según nivel de acceso
    // SuperAdmin ve todo, Admin normal solo su tenant
    const baseWhere = adminUser.isSuperAdmin
      ? {}
      : adminUser.primaryTenantId
        ? { primaryTenantId: adminUser.primaryTenantId }
        : { id: adminUser.id }; // Si no tiene tenant, solo puede verse a sí mismo

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

          // Community memberships
          rowiCommunities: {
            include: {
              community: {
                select: { id: true, name: true, slug: true, type: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        users,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al listar usuarios";
    console.error("❌ Error GET /api/admin/users:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo usuario
   ---------------------------------------------------------
   🔐 SEGURIDAD: Solo SuperAdmin puede crear usuarios
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdminGuard();
    if (auth.error) return auth.error;

    // 🔐 Solo SuperAdmin puede crear usuarios
    const authResult = await requireSuperAdmin();
    if (!authResult.success) return authResult.error;

    const body = await req.json();

    // 🛡️ Validación con Zod
    const validation = parseBody(body, userCreateSchema);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }
    const { name, email, tenantId, planId } = validation.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
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
      message: "Usuario creado correctamente",
      user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear usuario";
    console.error("❌ Error POST /api/admin/users:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Editar usuario (actualización completa)
   ---------------------------------------------------------
   🔐 SEGURIDAD:
   - SuperAdmin puede editar cualquier usuario
   - Admin puede editar usuarios de su tenant (excepto SuperAdmins)
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperAdminGuard();
    if (auth.error) return auth.error;

    // 🔐 Verificar permisos de admin
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.error;
    const adminUser = authResult.user;

    const body = await req.json();

    // 🛡️ Validación con Zod
    const validation = parseBody(body, userUpdateSchema);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }
    const {
      id,
      name,
      email,
      organizationRole,
      primaryTenantId,
      planId,
      allowAI,
      active,
      organizationId,
      hubId,
      orgRole,
      communityMemberships,
    } = validation.data;

    // 🔐 Verificar que el usuario objetivo existe y que tenemos permiso
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        primaryTenantId: true,
        organizationRole: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 🔐 Verificar permisos para modificar este usuario
    if (!adminUser.isSuperAdmin) {
      // No puede modificar SuperAdmins
      const targetIsSuperAdmin = targetUser.organizationRole?.toUpperCase() === "SUPERADMIN";
      if (targetIsSuperAdmin) {
        return NextResponse.json(
          { ok: false, error: "No tienes permisos para modificar a un SuperAdmin" },
          { status: 403 }
        );
      }

      // Solo puede modificar usuarios de su tenant
      if (targetUser.primaryTenantId !== adminUser.primaryTenantId) {
        return NextResponse.json(
          { ok: false, error: "No tienes permisos para modificar usuarios de otro tenant" },
          { status: 403 }
        );
      }

      // 🔐 Admin normal no puede asignar rol SUPERADMIN
      if (organizationRole?.toUpperCase() === "SUPERADMIN") {
        return NextResponse.json(
          { ok: false, error: "No tienes permisos para asignar el rol SuperAdmin" },
          { status: 403 }
        );
      }
    }

    // 1️⃣ Actualizar datos básicos del usuario (email ya validado por Zod)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(organizationRole !== undefined && { organizationRole }),
        ...(primaryTenantId !== undefined && { primaryTenantId }),
        ...(planId !== undefined && { planId: planId || null }),
        ...(allowAI !== undefined && { allowAI }),
        ...(active !== undefined && { active }),
      },
      include: {
        plan: { select: { id: true, name: true, priceUsd: true } },
        primaryTenant: { select: { id: true, name: true } },
      },
    });

    // 2️⃣ Manejar membresía de organización
    if (organizationId !== undefined) {
      await prisma.orgMembership.deleteMany({
        where: { userId: id },
      });

      if (organizationId) {
        await prisma.orgMembership.create({
          data: {
            userId: id,
            organizationId,
            role: orgRole || "MEMBER",
          },
        });
      }
    }

    // 3️⃣ Manejar membresía de hub
    if (hubId !== undefined) {
      await prisma.hubMembership.deleteMany({
        where: { userId: id },
      });

      if (hubId) {
        await prisma.hubMembership.create({
          data: {
            userId: id,
            hubId,
            access: "member",
          },
        });
      }
    }

    // 4️⃣ Manejar membresías de comunidades (sync completo)
    if (communityMemberships !== undefined) {
      // Delete all existing community memberships for this user
      await prisma.rowiCommunityUser.deleteMany({
        where: { userId: id },
      });

      // Create new memberships
      if (communityMemberships.length > 0) {
        await prisma.rowiCommunityUser.createMany({
          data: communityMemberships.map((cm) => ({
            userId: id,
            communityId: cm.communityId,
            role: cm.role,
            status: "active",
          })),
          skipDuplicates: true,
        });
      }
    }

    // 5️⃣ Obtener usuario actualizado con todas las relaciones
    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, priceUsd: true } },
        primaryTenant: { select: { id: true, name: true } },
        orgMemberships: {
          include: {
            organization: { select: { id: true, name: true, unitType: true } },
          },
        },
        hubMemberships: {
          include: {
            hub: {
              include: {
                superHub: { select: { id: true, name: true } },
              },
            },
          },
        },
        rowiCommunities: {
          include: {
            community: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Usuario actualizado correctamente",
      user: finalUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar usuario";
    console.error("❌ Error PATCH /api/admin/users:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar usuario
   ---------------------------------------------------------
   🔐 SEGURIDAD: Solo SuperAdmin puede eliminar usuarios
   Nadie puede eliminarse a sí mismo
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdminGuard();
    if (auth.error) return auth.error;

    // 🔐 Solo SuperAdmin puede eliminar usuarios
    const authResult = await requireSuperAdmin();
    if (!authResult.success) return authResult.error;
    const adminUser = authResult.user;

    const body = await req.json();

    // 🛡️ Validación con Zod
    const validation = parseBody(body, userDeleteSchema);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }
    const { id } = validation.data;

    // 🔐 No puede eliminarse a sí mismo
    if (!canDeleteUser(adminUser, id)) {
      return NextResponse.json(
        { ok: false, error: "No puedes eliminarte a ti mismo" },
        { status: 403 }
      );
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar usuario";
    console.error("❌ Error DELETE /api/admin/users:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
