// src/app/api/admin/organizations/hierarchy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🌲 API de Jerarquías Organizacionales

   Endpoints:
   - GET: Obtener árbol jerárquico completo
   - POST: Crear organización con parentId
   - PUT: Mover organización en el árbol
   - DELETE: Eliminar con validación de hijos
========================================================= */

interface OrgNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  unitType: string;
  level: number;
  inheritPermissions: boolean;
  _count: {
    members: number;
    children: number;
  };
  children?: OrgNode[];
}

/* =========================================================
   🔧 Helpers
========================================================= */

function normSlug(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/**
 * Detectar ciclos en jerarquía
 * Evita que una org sea su propio ancestro
 */
async function wouldCreateCycle(orgId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) return false;
  if (orgId === newParentId) return true;

  // Buscar todos los ancestros del nuevo padre
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return true; // Ciclo detectado
    if (currentId === orgId) return true; // orgId es ancestro de newParentId
    visited.add(currentId);

    const parentOrg: { parentId: string | null } | null = await prisma.organization.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = parentOrg?.parentId || null;
  }

  return false;
}

/**
 * Calcular nivel basado en parentId
 */
async function calculateLevel(parentId: string | null): Promise<number> {
  if (!parentId) return 0;

  const parent = await prisma.organization.findUnique({
    where: { id: parentId },
    select: { level: true },
  });

  return (parent?.level ?? 0) + 1;
}

/**
 * Actualizar niveles de todos los descendientes recursivamente
 */
async function updateDescendantLevels(orgId: string, baseLevel: number): Promise<void> {
  const children = await prisma.organization.findMany({
    where: { parentId: orgId },
    select: { id: true },
  });

  for (const child of children) {
    await prisma.organization.update({
      where: { id: child.id },
      data: { level: baseLevel + 1 },
    });
    await updateDescendantLevels(child.id, baseLevel + 1);
  }
}

/**
 * Construir árbol desde lista plana
 */
function buildTree(orgs: OrgNode[], parentId: string | null = null): OrgNode[] {
  return orgs
    .filter((org) => org.parentId === parentId)
    .map((org) => ({
      ...org,
      children: buildTree(orgs, org.id),
    }))
    .sort((a, b) => {
      // Ordenar por unitType y luego por nombre
      const typeOrder = ["WORLD", "REGION", "COUNTRY", "DIVISION", "TEAM", "CLIENT"];
      const typeA = typeOrder.indexOf(a.unitType);
      const typeB = typeOrder.indexOf(b.unitType);
      if (typeA !== typeB) return typeA - typeB;
      return a.name.localeCompare(b.name);
    });
}

/* =========================================================
   🔍 GET — Obtener árbol jerárquico

   Query params:
   - flat=true: Devolver lista plana en lugar de árbol
   - rootId: Obtener subárbol desde un nodo específico
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const flat = searchParams.get("flat") === "true";
    const rootId = searchParams.get("rootId");
    const unitType = searchParams.get("unitType");

    const where: any = {};

    if (unitType) {
      where.unitType = unitType;
    }

    const orgs = await prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        unitType: true,
        level: true,
        inheritPermissions: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    // Si hay rootId, filtrar para obtener solo ese subárbol
    let filteredOrgs = orgs as OrgNode[];
    if (rootId) {
      const descendants = new Set<string>();
      const findDescendants = (id: string) => {
        descendants.add(id);
        orgs
          .filter((o) => o.parentId === id)
          .forEach((o) => findDescendants(o.id));
      };
      findDescendants(rootId);
      filteredOrgs = orgs.filter((o) => descendants.has(o.id)) as OrgNode[];
    }

    if (flat) {
      return NextResponse.json({
        ok: true,
        total: filteredOrgs.length,
        organizations: filteredOrgs,
      });
    }

    // Construir árbol
    const tree = buildTree(filteredOrgs, rootId || null);

    return NextResponse.json({
      ok: true,
      total: filteredOrgs.length,
      tree,
      // También incluir lista plana para búsquedas
      organizations: filteredOrgs,
    });
  } catch (error: any) {
    console.error("❌ Error GET /api/admin/organizations/hierarchy:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener jerarquía" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear organización en jerarquía
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const {
      name,
      slug,
      description,
      parentId,
      unitType = "TEAM",
      inheritPermissions = true,
    } = await req.json();

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "El campo 'name' es obligatorio" },
        { status: 400 }
      );
    }

    const normalizedSlug = normSlug(slug || name);

    // Verificar slug único
    const exists = await prisma.organization.findUnique({
      where: { slug: normalizedSlug },
    });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una organización con ese slug" },
        { status: 409 }
      );
    }

    // Validar parentId si existe
    if (parentId) {
      const parent = await prisma.organization.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { ok: false, error: "La organización padre no existe" },
          { status: 400 }
        );
      }
    }

    // Calcular nivel
    const level = await calculateLevel(parentId);

    // Crear organización
    const org = await prisma.organization.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
        parentId: parentId || null,
        unitType,
        level,
        inheritPermissions,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { members: true, children: true },
        },
      },
    });

    console.log(`🏢 Organización creada: ${org.name} (nivel ${level})`);
    return NextResponse.json({ ok: true, organization: org }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST /api/admin/organizations/hierarchy:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Actualizar o mover organización
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const {
      id,
      name,
      slug,
      description,
      parentId,
      unitType,
      inheritPermissions,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la organización" },
        { status: 400 }
      );
    }

    const current = await prisma.organization.findUnique({
      where: { id },
      select: { parentId: true, level: true },
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Validar que no se cree un ciclo
    if (parentId !== undefined && parentId !== current.parentId) {
      const wouldCycle = await wouldCreateCycle(id, parentId);
      if (wouldCycle) {
        return NextResponse.json(
          { ok: false, error: "No se puede mover: crearía un ciclo en la jerarquía" },
          { status: 400 }
        );
      }
    }

    // Calcular nuevo nivel si cambia el padre
    let newLevel = current.level;
    const parentChanged = parentId !== undefined && parentId !== current.parentId;
    if (parentChanged) {
      newLevel = await calculateLevel(parentId);
    }

    // Normalizar slug si se proporciona
    const normalizedSlug = slug ? normSlug(slug) : undefined;

    // Verificar unicidad del nuevo slug
    if (normalizedSlug) {
      const slugExists = await prisma.organization.findFirst({
        where: {
          slug: normalizedSlug,
          id: { not: id },
        },
      });
      if (slugExists) {
        return NextResponse.json(
          { ok: false, error: "Ya existe otra organización con ese slug" },
          { status: 409 }
        );
      }
    }

    // Actualizar organización
    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(normalizedSlug && { slug: normalizedSlug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(unitType && { unitType }),
        ...(inheritPermissions !== undefined && { inheritPermissions }),
        ...(parentChanged && { level: newLevel }),
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { members: true, children: true },
        },
      },
    });

    // Si cambió el padre, actualizar niveles de todos los descendientes
    if (parentChanged) {
      await updateDescendantLevels(id, newLevel);
    }

    console.log(`✏️ Organización actualizada: ${org.name}`);
    return NextResponse.json({ ok: true, organization: org });
  } catch (error: any) {
    console.error("❌ Error PUT /api/admin/organizations/hierarchy:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar organización

   Query params:
   - cascade=true: Eliminar también todos los hijos
   - reparent=true: Mover hijos al padre de la org eliminada
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, cascade = false, reparent = false } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de la organización" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        children: { select: { id: true, name: true } },
      },
    });

    if (!org) {
      return NextResponse.json(
        { ok: false, error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Si tiene hijos y no se especifica qué hacer
    if (org.children.length > 0 && !cascade && !reparent) {
      return NextResponse.json(
        {
          ok: false,
          error: "La organización tiene hijos. Especifica cascade=true o reparent=true",
          children: org.children,
        },
        { status: 400 }
      );
    }

    // Si reparent, mover hijos al abuelo
    if (reparent && org.children.length > 0) {
      const newParentId = org.parentId;
      const newLevel = await calculateLevel(newParentId);

      await prisma.organization.updateMany({
        where: { parentId: id },
        data: { parentId: newParentId, level: newLevel },
      });

      // Actualizar niveles de nietos
      for (const child of org.children) {
        await updateDescendantLevels(child.id, newLevel);
      }

      console.log(`🔄 ${org.children.length} hijos movidos al padre`);
    }

    // Si cascade, eliminar recursivamente (el onDelete: Cascade debería manejarlo)
    // pero verificamos que sea intencional
    if (cascade && org.children.length > 0) {
      console.log(`⚠️ Eliminación en cascada de ${org.children.length} hijos`);
    }

    await prisma.organization.delete({ where: { id } });
    console.log(`🗑️ Organización eliminada: ${org.name}`);

    return NextResponse.json({
      ok: true,
      message: "Organización eliminada correctamente",
      childrenAffected: org.children.length,
      action: cascade ? "cascade" : reparent ? "reparent" : "none",
    });
  } catch (error: any) {
    console.error("❌ Error DELETE /api/admin/organizations/hierarchy:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar organización" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración del endpoint
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";
