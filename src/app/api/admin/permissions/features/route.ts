// src/app/api/admin/permissions/features/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🎛️ API de Permisos de Features por Perfil

   Endpoints:
   - GET: Obtener features permitidas por rol
   - POST: Crear/actualizar permiso de feature
   - PUT: Actualizar múltiples permisos en batch
   - DELETE: Eliminar permiso de feature
========================================================= */

interface FeaturePermission {
  id?: string;
  role: string;
  roleType: string;
  featureKey: string;
  category: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  description?: string | null;
  priority?: number;
  scopeType?: string | null;
  scopeId?: string | null;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/* =========================================================
   🔍 GET — Obtener permisos por rol

   Query params:
   - role: Filtrar por rol específico
   - roleType: Filtrar por tipo de rol (org/tenant/custom)
   - category: Filtrar por categoría de feature
   - scopeType/scopeId: Filtrar por scope específico
   - withDefaults: Incluir defaults para features sin configurar
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const roleType = searchParams.get("roleType") || "org";
    const category = searchParams.get("category");
    const scopeType = searchParams.get("scopeType");
    const scopeId = searchParams.get("scopeId");
    const withDefaults = searchParams.get("withDefaults") === "true";

    // Construir filtro
    const where: any = {};
    if (role) where.role = role;
    if (roleType) where.roleType = roleType;
    if (category) where.category = category;
    if (scopeType) where.scopeType = scopeType;
    if (scopeId) where.scopeId = scopeId;

    // Obtener permisos configurados
    const permissions = await prisma.profileFeature.findMany({
      where,
      orderBy: [{ category: "asc" }, { priority: "asc" }, { featureKey: "asc" }],
    });

    // Si se piden defaults, incluir features no configuradas
    let allFeatures: FeaturePermission[] = permissions;

    if (withDefaults && role) {
      const allDefinitions = await prisma.featureDefinition.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });

      const configuredKeys = new Set(permissions.map((p) => p.featureKey));

      // Agregar defaults para features no configuradas
      const defaults = allDefinitions
        .filter((def) => !configuredKeys.has(def.key))
        .map((def) => ({
          role,
          roleType,
          featureKey: def.key,
          category: def.category,
          canView: def.isDefault,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          description: def.description,
          priority: 0,
          scopeType: scopeType || null,
          scopeId: scopeId || null,
          isDefault: true, // Marcar que es un default
        }));

      allFeatures = [...permissions, ...defaults];
    }

    // Agrupar por categoría para el dropdown
    const byCategory = allFeatures.reduce((acc, perm) => {
      const cat = perm.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    }, {} as Record<string, FeaturePermission[]>);

    return NextResponse.json({
      ok: true,
      total: allFeatures.length,
      permissions: allFeatures,
      byCategory,
    });
  } catch (error: any) {
    console.error("❌ Error GET /api/admin/permissions/features:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener permisos" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear permiso de feature
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const {
      role,
      roleType = "org",
      featureKey,
      category = "general",
      canView = false,
      canCreate = false,
      canEdit = false,
      canDelete = false,
      description,
      priority = 0,
      scopeType,
      scopeId,
    } = await req.json();

    if (!role || !featureKey) {
      return NextResponse.json(
        { ok: false, error: "Los campos 'role' y 'featureKey' son obligatorios" },
        { status: 400 }
      );
    }

    // Upsert: crear o actualizar si ya existe
    const permission = await prisma.profileFeature.upsert({
      where: {
        role_roleType_featureKey_scopeType_scopeId: {
          role,
          roleType,
          featureKey,
          scopeType: scopeType || null,
          scopeId: scopeId || null,
        },
      },
      create: {
        role,
        roleType,
        featureKey,
        category,
        canView,
        canCreate,
        canEdit,
        canDelete,
        description,
        priority,
        scopeType,
        scopeId,
      },
      update: {
        category,
        canView,
        canCreate,
        canEdit,
        canDelete,
        description,
        priority,
      },
    });

    console.log(`🎛️ Permiso configurado: ${role}/${featureKey} -> view:${canView}`);
    return NextResponse.json({ ok: true, permission }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST /api/admin/permissions/features:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear permiso" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Actualizar múltiples permisos en batch

   Body: { permissions: FeaturePermission[] }
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { permissions } = await req.json();

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Se requiere un array de permisos" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const perm of permissions) {
      try {
        const { role, roleType = "org", featureKey, scopeType, scopeId, ...data } = perm;

        if (!role || !featureKey) {
          errors.push({ featureKey, error: "Faltan campos obligatorios" });
          continue;
        }

        const result = await prisma.profileFeature.upsert({
          where: {
            role_roleType_featureKey_scopeType_scopeId: {
              role,
              roleType,
              featureKey,
              scopeType: scopeType || null,
              scopeId: scopeId || null,
            },
          },
          create: {
            role,
            roleType,
            featureKey,
            category: data.category || "general",
            canView: data.canView ?? false,
            canCreate: data.canCreate ?? false,
            canEdit: data.canEdit ?? false,
            canDelete: data.canDelete ?? false,
            description: data.description,
            priority: data.priority ?? 0,
            scopeType,
            scopeId,
          },
          update: {
            canView: data.canView,
            canCreate: data.canCreate,
            canEdit: data.canEdit,
            canDelete: data.canDelete,
            category: data.category,
            description: data.description,
            priority: data.priority,
          },
        });

        results.push(result);
      } catch (err: any) {
        errors.push({ featureKey: perm.featureKey, error: err.message });
      }
    }

    console.log(`✏️ Permisos actualizados: ${results.length} OK, ${errors.length} errores`);
    return NextResponse.json({
      ok: errors.length === 0,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("❌ Error PUT /api/admin/permissions/features:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar permisos" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar permiso de feature
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, role, roleType, featureKey, scopeType, scopeId } = await req.json();

    // Por ID directo
    if (id) {
      await prisma.profileFeature.delete({ where: { id } });
      return NextResponse.json({
        ok: true,
        message: "Permiso eliminado correctamente",
      });
    }

    // Por clave compuesta
    if (role && featureKey) {
      await prisma.profileFeature.delete({
        where: {
          role_roleType_featureKey_scopeType_scopeId: {
            role,
            roleType: roleType || "org",
            featureKey,
            scopeType: scopeType || null,
            scopeId: scopeId || null,
          },
        },
      });
      return NextResponse.json({
        ok: true,
        message: "Permiso eliminado correctamente",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Falta id o (role + featureKey)" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Error DELETE /api/admin/permissions/features:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar permiso" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración del endpoint
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";
