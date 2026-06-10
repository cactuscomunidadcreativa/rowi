import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Re-export authOptions for convenience
export { authOptions };

/* =========================================================
   🧩 getServerAuthUser — VERSIÓN FINAL PARA APP ROUTER
   ---------------------------------------------------------
   ✔ SIN req/res
   ✔ SIN getHeader
   ✔ FUNCIONA en API Route Handlers

   SEGURIDAD (B5): el JWT solo aporta la identidad (user id);
   roles y permisos se releen de la DB en CADA llamada. Revocar
   SuperAdmin/permisos surte efecto en el siguiente request — no
   esperes a que expire el token. No autorices nunca desde claims
   del token (token.role / token.isSuperAdmin): usa este helper o
   los guards de requireAdmin.ts, que pasan por aquí.
========================================================= */
export async function getServerAuthUser() {
  // 1️⃣ App Router: obtener sesión directo
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;
  const userId = session.user.id;

  // 2️⃣ Cargar datos completos del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: true,
      memberships: true,
      primaryTenant: {
        select: { id: true, name: true, slug: true },
      },
      hubMemberships: {
        include: {
          hub: {
            include: {
              superHub: {
                include: {
                  tenants: true,
                  organizations: true,
                  hubs: true,
                },
              },
            },
          },
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          weekflowAccess: true,
          weekflowInsights: true,
          rowiAffinityAccess: true,
          maxUsers: true,
          maxCommunities: true,
        }
      },
    },
  });

  if (!user) return null;

  /* =========================================================
     🔥 SUPERADMIN DETECTION
  ========================================================== */
  const normalizedOrgRole = (user.organizationRole || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  const hasOrgSuperAdmin = normalizedOrgRole === "SUPERADMIN";

  const hasPermissionSuperAdmin = user.permissions?.some(
    (p) =>
      ["SUPERADMIN", "SUPER_ADMIN"].includes(p.role?.toUpperCase()) &&
      p.scopeType === "rowiverse" &&
      p.scopeId === "rowiverse_root"
  );

  const isSuperAdmin = hasOrgSuperAdmin || hasPermissionSuperAdmin;

  /* =========================================================
     🔥 Mapeo de Hubs y SuperHubs
  ========================================================== */
  const hubs = user.hubMemberships.map((m) => {
    const hub = m.hub;
    const sh = hub.superHub;

    return {
      id: hub.id,
      slug: hub.slug,
      name: hub.name,
      visibility: hub.visibility,

      superHub: sh
        ? {
            id: sh.id,
            slug: sh.slug,
            name: sh.name,
            description: sh.description,
            colorTheme: sh.colorTheme,
            language: sh.language,
            region: sh.region,
            country: sh.country,
            tenants: sh.tenants?.map((t) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
            })),
            organizations: sh.organizations?.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
            })),
            hubs: sh.hubs?.map((h) => ({
              id: h.id,
              name: h.name,
              slug: h.slug,
            })),
          }
        : null,
    };
  });

  // Lista limpia de SuperHubs
  const superHubs = hubs
    .map((h) => h.superHub)
    .filter(Boolean)
    .filter(
      (sh, index, arr) => arr.findIndex((x) => x?.id === sh?.id) === index
    );

  /* =========================================================
     🔚 RETORNO FINAL
  ========================================================== */
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationRole: user.organizationRole,

    isSuperAdmin,
    allowAI: user.allowAI,

    primaryTenantId: user.primaryTenantId,
    primaryTenant: user.primaryTenant,

    permissions: user.permissions,
    memberships: user.memberships,

    hubs,
    superHubs,
    plan: user.plan,
  };
}