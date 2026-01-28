// scripts/add-admin-translations.ts
// ============================================================
// Adds translations for admin pages (Plans, Hubs, SuperHubs)
// Run with: npx tsx scripts/add-admin-translations.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TranslationEntry {
  ns: string;
  key: string;
  es: string;
  en: string;
}

const translations: TranslationEntry[] = [
  // ============================================================
  // Plans Page
  // ============================================================
  { ns: "admin", key: "plans.title", es: "Planes", en: "Plans" },
  { ns: "admin", key: "plans.description", es: "Gestiona los planes de suscripcion del ecosistema", en: "Manage subscription plans for the ecosystem" },
  { ns: "admin", key: "plans.new", es: "Nuevo Plan", en: "New Plan" },
  { ns: "admin", key: "plans.edit", es: "Editar Plan", en: "Edit Plan" },
  { ns: "admin", key: "plans.name", es: "Nombre del plan", en: "Plan name" },
  { ns: "admin", key: "plans.price", es: "Precio (USD)", en: "Price (USD)" },
  { ns: "admin", key: "plans.duration", es: "Duracion (dias)", en: "Duration (days)" },
  { ns: "admin", key: "plans.days", es: "dias", en: "days" },
  { ns: "admin", key: "plans.aiEnabled", es: "IA Habilitada", en: "AI Enabled" },
  { ns: "admin", key: "plans.aiActive", es: "IA Activa", en: "AI Active" },
  { ns: "admin", key: "plans.aiInactive", es: "Sin IA", en: "No AI" },
  { ns: "admin", key: "plans.descriptionField", es: "Descripcion del plan", en: "Plan description" },
  { ns: "admin", key: "plans.nameRequired", es: "El nombre es obligatorio", en: "Name is required" },
  { ns: "admin", key: "plans.created", es: "Plan creado correctamente", en: "Plan created successfully" },
  { ns: "admin", key: "plans.updated", es: "Plan actualizado correctamente", en: "Plan updated successfully" },
  { ns: "admin", key: "plans.deleted", es: "Plan eliminado", en: "Plan deleted" },
  { ns: "admin", key: "plans.confirmDelete", es: "Estas seguro de eliminar este plan?", en: "Are you sure you want to delete this plan?" },
  { ns: "admin", key: "plans.noPlans", es: "No hay planes creados", en: "No plans created" },

  // ============================================================
  // Hubs Page
  // ============================================================
  { ns: "admin", key: "hubs.title", es: "Hubs", en: "Hubs" },
  { ns: "admin", key: "hubs.description", es: "Gestiona los hubs de la plataforma", en: "Manage platform hubs" },
  { ns: "admin", key: "hubs.new", es: "Nuevo Hub", en: "New Hub" },
  { ns: "admin", key: "hubs.edit", es: "Editar Hub", en: "Edit Hub" },
  { ns: "admin", key: "hubs.name", es: "Nombre del hub", en: "Hub name" },
  { ns: "admin", key: "hubs.slug", es: "Slug del hub", en: "Hub slug" },
  { ns: "admin", key: "hubs.descriptionField", es: "Descripcion del hub", en: "Hub description" },
  { ns: "admin", key: "hubs.selectTenant", es: "Seleccionar Tenant", en: "Select Tenant" },
  { ns: "admin", key: "hubs.selectSuperHub", es: "Seleccionar SuperHub", en: "Select SuperHub" },
  { ns: "admin", key: "hubs.noSuperHub", es: "Sin SuperHub", en: "No SuperHub" },
  { ns: "admin", key: "hubs.noTenant", es: "Sin Tenant", en: "No Tenant" },
  { ns: "admin", key: "hubs.visibility", es: "Visibilidad", en: "Visibility" },
  { ns: "admin", key: "hubs.public", es: "Publico", en: "Public" },
  { ns: "admin", key: "hubs.private", es: "Privado", en: "Private" },
  { ns: "admin", key: "hubs.requiredFields", es: "Nombre, slug y tenant son obligatorios", en: "Name, slug and tenant are required" },
  { ns: "admin", key: "hubs.created", es: "Hub creado correctamente", en: "Hub created successfully" },
  { ns: "admin", key: "hubs.updated", es: "Hub actualizado correctamente", en: "Hub updated successfully" },
  { ns: "admin", key: "hubs.deleted", es: "Hub eliminado", en: "Hub deleted" },
  { ns: "admin", key: "hubs.confirmDelete", es: "Estas seguro de eliminar este hub?", en: "Are you sure you want to delete this hub?" },
  { ns: "admin", key: "hubs.noHubs", es: "No hay hubs creados", en: "No hubs created" },

  // ============================================================
  // SuperHubs Page
  // ============================================================
  { ns: "admin", key: "superhubs.title", es: "SuperHubs", en: "SuperHubs" },
  { ns: "admin", key: "superhubs.description", es: "Nodos federadores del ecosistema Rowi", en: "Federation nodes of the Rowi ecosystem" },
  { ns: "admin", key: "superhubs.new", es: "Nuevo SuperHub", en: "New SuperHub" },
  { ns: "admin", key: "superhubs.edit", es: "Editar SuperHub", en: "Edit SuperHub" },
  { ns: "admin", key: "superhubs.name", es: "Nombre del SuperHub", en: "SuperHub name" },
  { ns: "admin", key: "superhubs.descriptionField", es: "Descripcion del SuperHub", en: "SuperHub description" },
  { ns: "admin", key: "superhubs.vision", es: "Vision", en: "Vision" },
  { ns: "admin", key: "superhubs.mission", es: "Mision", en: "Mission" },
  { ns: "admin", key: "superhubs.hubsLinked", es: "Hubs", en: "Hubs" },
  { ns: "admin", key: "superhubs.dynamicRoles", es: "Roles", en: "Roles" },
  { ns: "admin", key: "superhubs.nameRequired", es: "El nombre es obligatorio", en: "Name is required" },
  { ns: "admin", key: "superhubs.created", es: "SuperHub creado correctamente", en: "SuperHub created successfully" },
  { ns: "admin", key: "superhubs.updated", es: "SuperHub actualizado correctamente", en: "SuperHub updated successfully" },
  { ns: "admin", key: "superhubs.deleted", es: "SuperHub eliminado", en: "SuperHub deleted" },
  { ns: "admin", key: "superhubs.confirmDelete", es: "Estas seguro de eliminar este SuperHub?", en: "Are you sure you want to delete this SuperHub?" },
  { ns: "admin", key: "superhubs.noSuperHubs", es: "No hay SuperHubs creados", en: "No SuperHubs created" },

  // ============================================================
  // Tenants Page (for reuse)
  // ============================================================
  { ns: "admin", key: "tenants.title", es: "Tenants", en: "Tenants" },
  { ns: "admin", key: "tenants.description", es: "Gestiona los tenants del ecosistema", en: "Manage ecosystem tenants" },
  { ns: "admin", key: "tenants.new", es: "Nuevo Tenant", en: "New Tenant" },
  { ns: "admin", key: "tenants.edit", es: "Editar Tenant", en: "Edit Tenant" },
  { ns: "admin", key: "tenants.name", es: "Nombre del tenant", en: "Tenant name" },
  { ns: "admin", key: "tenants.slug", es: "Slug del tenant", en: "Tenant slug" },
  { ns: "admin", key: "tenants.billingEmail", es: "Email de facturacion", en: "Billing email" },
  { ns: "admin", key: "tenants.selectPlan", es: "Seleccionar Plan", en: "Select Plan" },
  { ns: "admin", key: "tenants.selectSuperHub", es: "Seleccionar SuperHub", en: "Select SuperHub" },
  { ns: "admin", key: "tenants.noTenants", es: "No hay tenants creados", en: "No tenants created" },

  // ============================================================
  // Organizations Page (for reuse)
  // ============================================================
  { ns: "admin", key: "orgs.title", es: "Organizaciones", en: "Organizations" },
  { ns: "admin", key: "orgs.description", es: "Gestiona las organizaciones del ecosistema", en: "Manage ecosystem organizations" },
  { ns: "admin", key: "orgs.new", es: "Nueva Organizacion", en: "New Organization" },
  { ns: "admin", key: "orgs.edit", es: "Editar Organizacion", en: "Edit Organization" },
  { ns: "admin", key: "orgs.name", es: "Nombre de la organizacion", en: "Organization name" },
  { ns: "admin", key: "orgs.noOrgs", es: "No hay organizaciones creadas", en: "No organizations created" },

  // ============================================================
  // Users Page (for reuse)
  // ============================================================
  { ns: "admin", key: "users.title", es: "Usuarios", en: "Users" },
  { ns: "admin", key: "users.description", es: "Gestiona los usuarios del ecosistema", en: "Manage ecosystem users" },
  { ns: "admin", key: "users.new", es: "Nuevo Usuario", en: "New User" },
  { ns: "admin", key: "users.edit", es: "Editar Usuario", en: "Edit User" },
  { ns: "admin", key: "users.name", es: "Nombre del usuario", en: "User name" },
  { ns: "admin", key: "users.email", es: "Email del usuario", en: "User email" },
  { ns: "admin", key: "users.noUsers", es: "No hay usuarios", en: "No users" },

  // ============================================================
  // Roles Page (for reuse)
  // ============================================================
  { ns: "admin", key: "roles.title", es: "Roles", en: "Roles" },
  { ns: "admin", key: "roles.description", es: "Gestiona los roles y permisos", en: "Manage roles and permissions" },
  { ns: "admin", key: "roles.new", es: "Nuevo Rol", en: "New Role" },
  { ns: "admin", key: "roles.edit", es: "Editar Rol", en: "Edit Role" },
  { ns: "admin", key: "roles.name", es: "Nombre del rol", en: "Role name" },
  { ns: "admin", key: "roles.noRoles", es: "No hay roles creados", en: "No roles created" },

  // ============================================================
  // Common Admin
  // ============================================================
  { ns: "admin", key: "common.created", es: "Creado", en: "Created" },
  { ns: "admin", key: "common.updated", es: "Actualizado", en: "Updated" },
  { ns: "admin", key: "common.enabled", es: "Habilitado", en: "Enabled" },
  { ns: "admin", key: "common.disabled", es: "Deshabilitado", en: "Disabled" },
  { ns: "admin", key: "common.yes", es: "Si", en: "Yes" },
  { ns: "admin", key: "common.no", es: "No", en: "No" },
  { ns: "admin", key: "common.all", es: "Todos", en: "All" },
  { ns: "admin", key: "common.none", es: "Ninguno", en: "None" },
  { ns: "admin", key: "common.select", es: "Seleccionar", en: "Select" },
  { ns: "admin", key: "common.filter", es: "Filtrar", en: "Filter" },
  { ns: "admin", key: "common.sort", es: "Ordenar", en: "Sort" },
  { ns: "admin", key: "common.actions", es: "Acciones", en: "Actions" },
  { ns: "admin", key: "common.details", es: "Detalles", en: "Details" },
  { ns: "admin", key: "common.view", es: "Ver", en: "View" },
  { ns: "admin", key: "common.export", es: "Exportar", en: "Export" },
  { ns: "admin", key: "common.import", es: "Importar", en: "Import" },
  { ns: "admin", key: "common.download", es: "Descargar", en: "Download" },
  { ns: "admin", key: "common.upload", es: "Subir", en: "Upload" },
  { ns: "admin", key: "common.copy", es: "Copiar", en: "Copy" },
  { ns: "admin", key: "common.paste", es: "Pegar", en: "Paste" },
  { ns: "admin", key: "common.duplicate", es: "Duplicar", en: "Duplicate" },
  { ns: "admin", key: "common.archive", es: "Archivar", en: "Archive" },
  { ns: "admin", key: "common.restore", es: "Restaurar", en: "Restore" },
  { ns: "admin", key: "common.preview", es: "Vista previa", en: "Preview" },
  { ns: "admin", key: "common.publish", es: "Publicar", en: "Publish" },
  { ns: "admin", key: "common.unpublish", es: "Despublicar", en: "Unpublish" },
  { ns: "admin", key: "common.draft", es: "Borrador", en: "Draft" },
  { ns: "admin", key: "common.published", es: "Publicado", en: "Published" },
  { ns: "admin", key: "common.pending", es: "Pendiente", en: "Pending" },
  { ns: "admin", key: "common.approved", es: "Aprobado", en: "Approved" },
  { ns: "admin", key: "common.rejected", es: "Rechazado", en: "Rejected" },

  // ============================================================
  // View Details / Hide
  // ============================================================
  { ns: "common", key: "viewDetails", es: "Ver detalles", en: "View details" },
  { ns: "common", key: "hide", es: "Ocultar", en: "Hide" },
  { ns: "common", key: "show", es: "Mostrar", en: "Show" },
  { ns: "common", key: "expand", es: "Expandir", en: "Expand" },
  { ns: "common", key: "collapse", es: "Contraer", en: "Collapse" },
];

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - Adding Admin Translations");
  console.log("=".repeat(60));
  console.log("\n");

  let created = 0;
  let updated = 0;

  for (const t of translations) {
    // Spanish
    const existingEs = await prisma.translation.findFirst({
      where: { ns: t.ns, key: t.key, lang: "es" },
    });
    if (existingEs) {
      await prisma.translation.update({
        where: { id: existingEs.id },
        data: { value: t.es },
      });
      updated++;
    } else {
      await prisma.translation.create({
        data: { ns: t.ns, key: t.key, lang: "es", value: t.es },
      });
      created++;
    }

    // English
    const existingEn = await prisma.translation.findFirst({
      where: { ns: t.ns, key: t.key, lang: "en" },
    });
    if (existingEn) {
      await prisma.translation.update({
        where: { id: existingEn.id },
        data: { value: t.en },
      });
      updated++;
    } else {
      await prisma.translation.create({
        data: { ns: t.ns, key: t.key, lang: "en", value: t.en },
      });
      created++;
    }
  }

  console.log(`Created: ${created}, Updated: ${updated}`);
  console.log(`Total translations processed: ${translations.length * 2}`);
  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
