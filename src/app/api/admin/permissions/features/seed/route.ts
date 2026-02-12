// src/app/api/admin/permissions/features/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🌱 Seed de Features del Sistema

   Crea las definiciones iniciales de features para permisos.
   Este endpoint inicializa el catálogo de features disponibles.
========================================================= */

const FEATURE_DEFINITIONS = [
  // 📊 Dashboard
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Panel principal con métricas y resumen",
    category: "dashboard",
    icon: "LayoutDashboard",
    route: "/hub/admin",
    isAdmin: false,
    isDefault: true,
  },
  {
    key: "dashboard.overview",
    name: "Vista General",
    description: "Resumen de actividad y KPIs",
    category: "dashboard",
    parentKey: "dashboard",
    icon: "PieChart",
    route: "/hub/admin",
    isDefault: true,
  },
  {
    key: "dashboard.analytics",
    name: "Analíticas",
    description: "Gráficos y tendencias detalladas",
    category: "dashboard",
    parentKey: "dashboard",
    icon: "TrendingUp",
    route: "/hub/admin/analytics",
    isDefault: false,
  },

  // 📈 Benchmarks
  {
    key: "benchmarks",
    name: "Benchmarks",
    description: "Módulo completo de benchmarks",
    category: "benchmarks",
    icon: "BarChart3",
    route: "/hub/admin/benchmarks",
    isAdmin: false,
    isDefault: true,
  },
  {
    key: "benchmarks.upload",
    name: "Subir Benchmarks",
    description: "Cargar archivos CSV de benchmarks",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "Upload",
    route: "/hub/admin/benchmarks/upload",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "benchmarks.stats",
    name: "Estadísticas",
    description: "Ver estadísticas y distribuciones",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "Activity",
    route: "/hub/admin/benchmarks/[id]/stats",
    isDefault: true,
  },
  {
    key: "benchmarks.topPerformers",
    name: "Top Performers",
    description: "Análisis de mejores resultados",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "TrendingUp",
    route: "/hub/admin/benchmarks/[id]/top-performers",
    isDefault: true,
  },
  {
    key: "benchmarks.compare",
    name: "Comparar",
    description: "Comparar usuarios con benchmarks",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "Users",
    route: "/hub/admin/benchmarks/compare",
    isDefault: true,
  },
  {
    key: "benchmarks.correlations",
    name: "Correlaciones",
    description: "Análisis de correlaciones competencias-resultados",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "Brain",
    isDefault: false,
  },
  {
    key: "benchmarks.calculate",
    name: "Calcular Análisis",
    description: "Ejecutar cálculos de análisis",
    category: "benchmarks",
    parentKey: "benchmarks",
    icon: "Calculator",
    isAdmin: true,
    isDefault: false,
  },

  // 👥 Usuarios
  {
    key: "users",
    name: "Usuarios",
    description: "Gestión de usuarios del sistema",
    category: "users",
    icon: "Users",
    route: "/hub/admin/users",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "users.list",
    name: "Listar Usuarios",
    description: "Ver lista de usuarios",
    category: "users",
    parentKey: "users",
    icon: "List",
    isDefault: true,
  },
  {
    key: "users.create",
    name: "Crear Usuarios",
    description: "Crear nuevos usuarios",
    category: "users",
    parentKey: "users",
    icon: "UserPlus",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "users.edit",
    name: "Editar Usuarios",
    description: "Modificar datos de usuarios",
    category: "users",
    parentKey: "users",
    icon: "UserCog",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "users.delete",
    name: "Eliminar Usuarios",
    description: "Eliminar usuarios del sistema",
    category: "users",
    parentKey: "users",
    icon: "UserMinus",
    isAdmin: true,
    isDefault: false,
  },

  // 🏢 Organizaciones
  {
    key: "organizations",
    name: "Organizaciones",
    description: "Gestión de organizaciones y jerarquía",
    category: "organizations",
    icon: "Building2",
    route: "/hub/admin/organizations",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "organizations.hierarchy",
    name: "Jerarquía",
    description: "Ver y gestionar árbol organizacional",
    category: "organizations",
    parentKey: "organizations",
    icon: "GitBranch",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "organizations.create",
    name: "Crear Organizaciones",
    description: "Crear nuevas organizaciones",
    category: "organizations",
    parentKey: "organizations",
    icon: "Plus",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "organizations.edit",
    name: "Editar Organizaciones",
    description: "Modificar organizaciones existentes",
    category: "organizations",
    parentKey: "organizations",
    icon: "Pencil",
    isAdmin: true,
    isDefault: false,
  },

  // 🔐 Permisos
  {
    key: "permissions",
    name: "Permisos",
    description: "Gestión de permisos y accesos",
    category: "permissions",
    icon: "Shield",
    route: "/hub/admin/permissions",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "permissions.roles",
    name: "Roles",
    description: "Configurar roles y sus permisos",
    category: "permissions",
    parentKey: "permissions",
    icon: "KeyRound",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "permissions.features",
    name: "Features",
    description: "Configurar visibilidad de features",
    category: "permissions",
    parentKey: "permissions",
    icon: "ToggleRight",
    isAdmin: true,
    isDefault: false,
  },

  // 📝 Reportes
  {
    key: "reports",
    name: "Reportes",
    description: "Generación y descarga de reportes",
    category: "reports",
    icon: "FileText",
    route: "/hub/admin/reports",
    isDefault: true,
  },
  {
    key: "reports.generate",
    name: "Generar Reportes",
    description: "Crear nuevos reportes",
    category: "reports",
    parentKey: "reports",
    icon: "FilePlus",
    isDefault: true,
  },
  {
    key: "reports.download",
    name: "Descargar Reportes",
    description: "Descargar reportes existentes",
    category: "reports",
    parentKey: "reports",
    icon: "Download",
    isDefault: true,
  },

  // ⚙️ Configuración
  {
    key: "settings",
    name: "Configuración",
    description: "Configuración del sistema",
    category: "settings",
    icon: "Settings",
    route: "/hub/admin/settings",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "settings.general",
    name: "General",
    description: "Configuración general del sistema",
    category: "settings",
    parentKey: "settings",
    icon: "Sliders",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "settings.branding",
    name: "Branding",
    description: "Logo, colores y marca",
    category: "settings",
    parentKey: "settings",
    icon: "Palette",
    isAdmin: true,
    isDefault: false,
  },
  {
    key: "settings.integrations",
    name: "Integraciones",
    description: "Conexiones con servicios externos",
    category: "settings",
    parentKey: "settings",
    icon: "Plug",
    isAdmin: true,
    isDefault: false,
  },

  // 🎓 Coach/Entrenador (para coaches)
  {
    key: "coach",
    name: "Panel de Coach",
    description: "Herramientas para coaches certificados",
    category: "coach",
    icon: "GraduationCap",
    route: "/hub/coach",
    isDefault: false,
  },
  {
    key: "coach.clients",
    name: "Mis Clientes",
    description: "Ver y gestionar clientes asignados",
    category: "coach",
    parentKey: "coach",
    icon: "Users",
    isDefault: false,
  },
  {
    key: "coach.sessions",
    name: "Sesiones",
    description: "Gestión de sesiones de coaching",
    category: "coach",
    parentKey: "coach",
    icon: "Calendar",
    isDefault: false,
  },

  // 🧩 Equipos
  {
    key: "teams",
    name: "Equipos",
    description: "Gestión de equipos",
    category: "teams",
    icon: "Users2",
    route: "/hub/admin/teams",
    isDefault: true,
  },
  {
    key: "teams.affinity",
    name: "Afinidad",
    description: "Análisis de afinidad de equipos",
    category: "teams",
    parentKey: "teams",
    icon: "Heart",
    isDefault: false,
  },
  {
    key: "teams.dynamics",
    name: "Dinámicas",
    description: "Dinámicas y actividades de equipo",
    category: "teams",
    parentKey: "teams",
    icon: "Sparkles",
    isDefault: false,
  },
];

// Permisos por defecto para cada rol
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  // OrgRole
  OWNER: ["*"], // Todo
  ADMIN: [
    "dashboard",
    "benchmarks",
    "users",
    "organizations",
    "permissions",
    "reports",
    "settings",
    "teams",
  ],
  MANAGER: [
    "dashboard",
    "benchmarks",
    "benchmarks.stats",
    "benchmarks.topPerformers",
    "benchmarks.compare",
    "reports",
    "teams",
  ],
  MEMBER: [
    "dashboard",
    "dashboard.overview",
    "benchmarks.stats",
    "benchmarks.compare",
    "reports.download",
  ],
  VIEWER: ["dashboard", "dashboard.overview"],

  // TenantRole adicionales
  SUPERADMIN: ["*"],
  EDITOR: [
    "dashboard",
    "benchmarks",
    "benchmarks.stats",
    "benchmarks.topPerformers",
    "reports",
  ],
  DEVELOPER: ["*"],
  FEDERATOR: [
    "dashboard",
    "benchmarks",
    "organizations",
    "users.list",
    "reports",
  ],
};

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    let created = 0;
    let updated = 0;
    let permissionsCreated = 0;

    // Crear/actualizar definiciones
    for (const def of FEATURE_DEFINITIONS) {
      const exists = await prisma.featureDefinition.findUnique({
        where: { key: def.key },
      });

      if (exists) {
        await prisma.featureDefinition.update({
          where: { key: def.key },
          data: def,
        });
        updated++;
      } else {
        await prisma.featureDefinition.create({
          data: def,
        });
        created++;
      }
    }

    // Crear permisos por defecto para cada rol
    for (const [role, features] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const roleType = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(
        role
      )
        ? "org"
        : "tenant";

      // Si tiene "*", crear permiso para todas las features
      const featuresToCreate =
        features[0] === "*"
          ? FEATURE_DEFINITIONS.map((d) => d.key)
          : features;

      for (const featureKey of featuresToCreate) {
        const def = FEATURE_DEFINITIONS.find((d) => d.key === featureKey);
        if (!def) continue;

        const exists = await prisma.profileFeature.findFirst({
          where: {
            role,
            roleType,
            featureKey,
            scopeType: null,
            scopeId: null,
          },
        });

        if (!exists) {
          await prisma.profileFeature.create({
            data: {
              role,
              roleType,
              featureKey,
              category: def.category,
              canView: true,
              canCreate: features[0] === "*" || def.isAdmin === false,
              canEdit: features[0] === "*" || def.isAdmin === false,
              canDelete: features[0] === "*",
              description: def.description,
            },
          });
          permissionsCreated++;
        }
      }
    }

    console.log(
      `🌱 Seed completado: ${created} creados, ${updated} actualizados, ${permissionsCreated} permisos`
    );
    return NextResponse.json({
      ok: true,
      message: "Seed completado",
      definitions: { created, updated },
      permissions: { created: permissionsCreated },
    });
  } catch (error: any) {
    console.error("❌ Error en seed:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error en seed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
