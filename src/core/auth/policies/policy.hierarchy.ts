// src/core/auth/policies/policy.hierarchy.ts

import { prisma } from "../../prisma";

/**
 * 🌲 SISTEMA DE PERMISOS HEREDADOS POR JERARQUÍA
 *
 * Cuando un usuario tiene permiso a una Organization "padre" (ej: LATAM),
 * automáticamente tiene acceso a todas las Organizations hijas que
 * tengan `inheritPermissions: true`.
 *
 * Jerarquía típica Six Seconds:
 * - WORLD (Six Seconds Global)
 *   - REGION (LATAM, EMEA, APAC)
 *     - COUNTRY (México, Colombia, Perú)
 *       - DIVISION (Corporate, Education)
 *         - TEAM (Equipo X)
 *           - CLIENT (Empresa Y)
 */

/**
 * Obtiene todos los IDs de organizaciones ancestras (padres, abuelos, etc.)
 * hasta llegar a la raíz.
 */
export async function getAncestorOrgIds(orgId: string): Promise<string[]> {
  const ancestors: string[] = [];
  let currentId: string | null = orgId;

  // Límite de seguridad para evitar loops infinitos
  const MAX_DEPTH = 20;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    const org = await prisma.organization.findUnique({
      where: { id: currentId },
      select: { parentId: true, inheritPermissions: true },
    });

    if (!org || !org.parentId) break;

    // Solo agregamos ancestros si esta org hereda permisos
    if (org.inheritPermissions) {
      ancestors.push(org.parentId);
    } else {
      // Si no hereda, cortamos la cadena
      break;
    }

    currentId = org.parentId;
    depth++;
  }

  return ancestors;
}

/**
 * Obtiene todos los IDs de organizaciones descendientes (hijos, nietos, etc.)
 * Solo incluye los que tienen `inheritPermissions: true`.
 */
export async function getDescendantOrgIds(orgId: string): Promise<string[]> {
  const descendants: string[] = [];
  const queue: string[] = [orgId];

  // Límite de seguridad
  const MAX_TOTAL = 1000;
  let processed = 0;

  while (queue.length > 0 && processed < MAX_TOTAL) {
    const currentId = queue.shift()!;
    processed++;

    const children = await prisma.organization.findMany({
      where: {
        parentId: currentId,
        inheritPermissions: true,
      },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

/**
 * Verifica si el usuario tiene acceso a una organización específica
 * considerando la herencia jerárquica.
 *
 * Un usuario tiene acceso si:
 * 1. Tiene membresía directa en la organización
 * 2. Tiene membresía en una organización ancestro (padre, abuelo, etc.)
 *    Y la organización objetivo hereda permisos
 */
export async function hasOrgAccessWithHierarchy(
  userId: string,
  targetOrgId: string
): Promise<boolean> {
  // 1️⃣ Verificar acceso directo
  const directMembership = await prisma.orgMembership.findFirst({
    where: { userId, organizationId: targetOrgId },
  });

  if (directMembership) return true;

  // 2️⃣ Verificar acceso heredado (buscar en ancestros)
  const ancestors = await getAncestorOrgIds(targetOrgId);

  if (ancestors.length === 0) return false;

  // Verificar si el usuario tiene membresía en algún ancestro
  const ancestorMembership = await prisma.orgMembership.findFirst({
    where: {
      userId,
      organizationId: { in: ancestors },
    },
  });

  return !!ancestorMembership;
}

/**
 * Obtiene todas las organizaciones a las que un usuario tiene acceso
 * considerando la herencia jerárquica.
 *
 * Incluye:
 * 1. Organizaciones con membresía directa
 * 2. Organizaciones descendientes de las anteriores (si heredan permisos)
 */
export async function getAccessibleOrgIds(userId: string): Promise<string[]> {
  // 1️⃣ Obtener organizaciones con membresía directa
  const directMemberships = await prisma.orgMembership.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  const directOrgIds = directMemberships.map((m) => m.organizationId);

  if (directOrgIds.length === 0) return [];

  // 2️⃣ Agregar todos los descendientes
  const allAccessible = new Set<string>(directOrgIds);

  for (const orgId of directOrgIds) {
    const descendants = await getDescendantOrgIds(orgId);
    descendants.forEach((id) => allAccessible.add(id));
  }

  return Array.from(allAccessible);
}

/**
 * Obtiene el rol más alto del usuario en la jerarquía de organizaciones
 * para una organización específica.
 *
 * El rol puede venir de:
 * 1. Membresía directa
 * 2. Membresía en una organización ancestro
 */
export async function getEffectiveOrgRole(
  userId: string,
  targetOrgId: string
): Promise<string | null> {
  // Orden de prioridad de roles
  const ROLE_PRIORITY: Record<string, number> = {
    OWNER: 100,
    ADMIN: 80,
    MANAGER: 60,
    COACH: 40,
    MEMBER: 20,
    VIEWER: 10,
  };

  // 1️⃣ Verificar rol directo
  const directMembership = await prisma.orgMembership.findFirst({
    where: { userId, organizationId: targetOrgId },
    select: { role: true },
  });

  if (directMembership) return directMembership.role;

  // 2️⃣ Buscar rol heredado del ancestro más cercano
  const ancestors = await getAncestorOrgIds(targetOrgId);

  if (ancestors.length === 0) return null;

  // Buscar membresías en ancestros
  const ancestorMemberships = await prisma.orgMembership.findMany({
    where: {
      userId,
      organizationId: { in: ancestors },
    },
    select: { role: true, organizationId: true },
  });

  if (ancestorMemberships.length === 0) return null;

  // Retornar el rol más alto encontrado
  let highestRole: string | null = null;
  let highestPriority = -1;

  for (const m of ancestorMemberships) {
    const priority = ROLE_PRIORITY[m.role] || 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      highestRole = m.role;
    }
  }

  return highestRole;
}

/**
 * Verifica si el usuario tiene un rol específico (o superior) en una organización,
 * considerando la herencia jerárquica.
 */
export async function hasOrgRole(
  userId: string,
  targetOrgId: string,
  requiredRole: string
): Promise<boolean> {
  const ROLE_PRIORITY: Record<string, number> = {
    OWNER: 100,
    ADMIN: 80,
    MANAGER: 60,
    COACH: 40,
    MEMBER: 20,
    VIEWER: 10,
  };

  const effectiveRole = await getEffectiveOrgRole(userId, targetOrgId);

  if (!effectiveRole) return false;

  const effectivePriority = ROLE_PRIORITY[effectiveRole] || 0;
  const requiredPriority = ROLE_PRIORITY[requiredRole] || 0;

  return effectivePriority >= requiredPriority;
}

/**
 * Obtiene el árbol de organizaciones accesibles para un usuario,
 * estructurado jerárquicamente.
 */
export async function getOrgHierarchyTree(userId: string) {
  const accessibleIds = await getAccessibleOrgIds(userId);

  if (accessibleIds.length === 0) return [];

  // Obtener todas las organizaciones accesibles con sus relaciones
  const orgs = await prisma.organization.findMany({
    where: { id: { in: accessibleIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      unitType: true,
      level: true,
      parentId: true,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });

  // Construir el árbol
  type OrgNode = {
    id: string;
    name: string;
    slug: string;
    unitType: string;
    level: number;
    children: OrgNode[];
  };

  const orgMap = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  // Primera pasada: crear nodos
  for (const org of orgs) {
    orgMap.set(org.id, {
      id: org.id,
      name: org.name,
      slug: org.slug,
      unitType: org.unitType,
      level: org.level,
      children: [],
    });
  }

  // Segunda pasada: construir jerarquía
  for (const org of orgs) {
    const node = orgMap.get(org.id)!;

    if (!org.parentId || !accessibleIds.includes(org.parentId)) {
      roots.push(node);
    } else {
      const parent = orgMap.get(org.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}
