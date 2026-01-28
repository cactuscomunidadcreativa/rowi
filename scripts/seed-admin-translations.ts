/**
 * 🌐 Seed Admin Translations
 * ---------------------------------------------------------
 * Agrega todas las traducciones del admin a la base de datos
 *
 * Ejecutar con: npx tsx scripts/seed-admin-translations.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const translations: { ns: string; key: string; es: string; en: string }[] = [
  // ============ Common ============
  { ns: "common", key: "loading", es: "Cargando...", en: "Loading..." },
  { ns: "common", key: "error", es: "Ocurrió un error", en: "An error occurred" },
  { ns: "common", key: "success", es: "Éxito", en: "Success" },
  { ns: "common", key: "save", es: "Guardar", en: "Save" },
  { ns: "common", key: "cancel", es: "Cancelar", en: "Cancel" },
  { ns: "common", key: "delete", es: "Eliminar", en: "Delete" },
  { ns: "common", key: "edit", es: "Editar", en: "Edit" },
  { ns: "common", key: "create", es: "Crear", en: "Create" },
  { ns: "common", key: "search", es: "Buscar", en: "Search" },
  { ns: "common", key: "filter", es: "Filtrar", en: "Filter" },
  { ns: "common", key: "yes", es: "Sí", en: "Yes" },
  { ns: "common", key: "no", es: "No", en: "No" },
  { ns: "common", key: "confirm", es: "Confirmar", en: "Confirm" },

  // ============ Admin Common ============
  { ns: "admin", key: "common.search", es: "Buscar...", en: "Search..." },
  { ns: "admin", key: "common.refresh", es: "Actualizar", en: "Refresh" },
  { ns: "admin", key: "common.save", es: "Guardar", en: "Save" },
  { ns: "admin", key: "common.cancel", es: "Cancelar", en: "Cancel" },
  { ns: "admin", key: "common.edit", es: "Editar", en: "Edit" },
  { ns: "admin", key: "common.delete", es: "Eliminar", en: "Delete" },
  { ns: "admin", key: "common.preview", es: "Vista previa", en: "Preview" },
  { ns: "admin", key: "common.details", es: "Detalles", en: "Details" },
  { ns: "admin", key: "common.actions", es: "Acciones", en: "Actions" },
  { ns: "admin", key: "common.status", es: "Estado", en: "Status" },
  { ns: "admin", key: "common.name", es: "Nombre", en: "Name" },
  { ns: "admin", key: "common.description", es: "Descripción", en: "Description" },
  { ns: "admin", key: "common.type", es: "Tipo", en: "Type" },
  { ns: "admin", key: "common.category", es: "Categoría", en: "Category" },
  { ns: "admin", key: "common.version", es: "Versión", en: "Version" },
  { ns: "admin", key: "common.config", es: "Configuración", en: "Configuration" },
  { ns: "admin", key: "common.enabled", es: "Habilitado", en: "Enabled" },
  { ns: "admin", key: "common.disabled", es: "Deshabilitado", en: "Disabled" },
  { ns: "admin", key: "common.active", es: "Activo", en: "Active" },
  { ns: "admin", key: "common.inactive", es: "Inactivo", en: "Inactive" },
  { ns: "admin", key: "common.all", es: "Todos", en: "All" },
  { ns: "admin", key: "common.none", es: "Ninguno", en: "None" },
  { ns: "admin", key: "common.select", es: "Seleccionar", en: "Select" },
  { ns: "admin", key: "common.close", es: "Cerrar", en: "Close" },
  { ns: "admin", key: "common.back", es: "Volver", en: "Back" },
  { ns: "admin", key: "common.next", es: "Siguiente", en: "Next" },
  { ns: "admin", key: "common.previous", es: "Anterior", en: "Previous" },
  { ns: "admin", key: "common.finish", es: "Finalizar", en: "Finish" },
  { ns: "admin", key: "common.add", es: "Agregar", en: "Add" },
  { ns: "admin", key: "common.remove", es: "Quitar", en: "Remove" },
  { ns: "admin", key: "common.new", es: "Nuevo", en: "New" },

  // ============ Admin Navigation ============
  { ns: "admin", key: "nav.dashboard", es: "Dashboard", en: "Dashboard" },
  { ns: "admin", key: "nav.pages", es: "Páginas", en: "Pages" },
  { ns: "admin", key: "nav.layouts", es: "Layouts", en: "Layouts" },
  { ns: "admin", key: "nav.components", es: "Componentes", en: "Components" },
  { ns: "admin", key: "nav.translations", es: "Traducciones", en: "Translations" },
  { ns: "admin", key: "nav.agents", es: "Agentes", en: "Agents" },
  { ns: "admin", key: "nav.users", es: "Usuarios", en: "Users" },
  { ns: "admin", key: "nav.settings", es: "Configuración", en: "Settings" },
  { ns: "admin", key: "nav.tenants", es: "Tenants", en: "Tenants" },
  { ns: "admin", key: "nav.organizations", es: "Organizaciones", en: "Organizations" },
  { ns: "admin", key: "nav.superhubs", es: "SuperHubs", en: "SuperHubs" },
  { ns: "admin", key: "nav.api", es: "API", en: "API" },
  { ns: "admin", key: "nav.logs", es: "Logs", en: "Logs" },
  { ns: "admin", key: "nav.analytics", es: "Analíticas", en: "Analytics" },
  { ns: "admin", key: "nav.media", es: "Media", en: "Media" },
  { ns: "admin", key: "nav.forms", es: "Formularios", en: "Forms" },
  { ns: "admin", key: "nav.menus", es: "Menús", en: "Menus" },
  { ns: "admin", key: "nav.themes", es: "Temas", en: "Themes" },

  // ============ Admin Pages ============
  { ns: "admin", key: "pages.title", es: "Páginas", en: "Pages" },
  { ns: "admin", key: "pages.description", es: "Gestiona las páginas del CMS", en: "Manage CMS pages" },
  { ns: "admin", key: "pages.noPages", es: "No hay páginas", en: "No pages found" },
  { ns: "admin", key: "pages.new", es: "Nueva página", en: "New page" },
  { ns: "admin", key: "pages.edit", es: "Editar página", en: "Edit page" },
  { ns: "admin", key: "pages.scan", es: "Escanear", en: "Scan" },
  { ns: "admin", key: "pages.created", es: "Página creada", en: "Page created" },
  { ns: "admin", key: "pages.updated", es: "Página actualizada", en: "Page updated" },
  { ns: "admin", key: "pages.deleted", es: "Página eliminada", en: "Page deleted" },
  { ns: "admin", key: "pages.confirmDelete", es: "¿Eliminar esta página?", en: "Delete this page?" },
  { ns: "admin", key: "pages.newPages", es: "páginas nuevas", en: "new pages" },
  { ns: "admin", key: "pages.updatedPages", es: "páginas actualizadas", en: "updated pages" },
  { ns: "admin", key: "pages.untitled", es: "Sin título", en: "Untitled" },
  { ns: "admin", key: "pages.titleField", es: "Título", en: "Title" },
  { ns: "admin", key: "pages.slug", es: "Slug (URL)", en: "Slug (URL)" },
  { ns: "admin", key: "pages.summary", es: "Resumen", en: "Summary" },
  { ns: "admin", key: "pages.content", es: "Contenido", en: "Content" },
  { ns: "admin", key: "pages.language", es: "Idioma", en: "Language" },
  { ns: "admin", key: "pages.visibility", es: "Visibilidad", en: "Visibility" },
  { ns: "admin", key: "pages.accessLevel", es: "Nivel de acceso", en: "Access level" },
  { ns: "admin", key: "pages.seoConfig", es: "Configuración SEO", en: "SEO Configuration" },
  { ns: "admin", key: "pages.public", es: "Público", en: "Public" },
  { ns: "admin", key: "pages.private", es: "Privado", en: "Private" },
  { ns: "admin", key: "pages.internal", es: "Interno", en: "Internal" },
  { ns: "admin", key: "pages.organization", es: "Organización", en: "Organization" },
  { ns: "admin", key: "pages.tab.general", es: "General", en: "General" },
  { ns: "admin", key: "pages.tab.content", es: "Contenido", en: "Content" },
  { ns: "admin", key: "pages.tab.seo", es: "SEO", en: "SEO" },
  { ns: "admin", key: "pages.tab.access", es: "Acceso", en: "Access" },

  // ============ Admin Layouts ============
  { ns: "admin", key: "layouts.title", es: "Layouts", en: "Layouts" },
  { ns: "admin", key: "layouts.description", es: "Diseña la estructura de tus páginas", en: "Design the structure of your pages" },
  { ns: "admin", key: "layouts.noLayouts", es: "No hay layouts", en: "No layouts found" },
  { ns: "admin", key: "layouts.new", es: "Nuevo layout", en: "New layout" },
  { ns: "admin", key: "layouts.edit", es: "Editar layout", en: "Edit layout" },
  { ns: "admin", key: "layouts.editDescription", es: "Arrastra y suelta componentes", en: "Drag and drop components" },
  { ns: "admin", key: "layouts.created", es: "Layout creado", en: "Layout created" },
  { ns: "admin", key: "layouts.updated", es: "Layout actualizado", en: "Layout updated" },
  { ns: "admin", key: "layouts.deleted", es: "Layout eliminado", en: "Layout deleted" },
  { ns: "admin", key: "layouts.confirmDelete", es: "¿Eliminar este layout?", en: "Delete this layout?" },
  { ns: "admin", key: "layouts.header", es: "Header", en: "Header" },
  { ns: "admin", key: "layouts.main", es: "Principal", en: "Main" },
  { ns: "admin", key: "layouts.footer", es: "Footer", en: "Footer" },
  { ns: "admin", key: "layouts.empty", es: "Zona vacía", en: "Empty zone" },
  { ns: "admin", key: "layouts.addComponent", es: "Agregar componente", en: "Add component" },
  { ns: "admin", key: "layouts.searchComponent", es: "Buscar componente...", en: "Search component..." },
  { ns: "admin", key: "layouts.componentCatalog", es: "Catálogo de componentes", en: "Component catalog" },

  // ============ Admin Components ============
  { ns: "admin", key: "components.title", es: "Componentes", en: "Components" },
  { ns: "admin", key: "components.description", es: "Gestiona los componentes reutilizables", en: "Manage reusable components" },
  { ns: "admin", key: "components.noComponents", es: "No hay componentes", en: "No components found" },
  { ns: "admin", key: "components.new", es: "Nuevo componente", en: "New component" },
  { ns: "admin", key: "components.edit", es: "Editar componente", en: "Edit component" },
  { ns: "admin", key: "components.created", es: "Componente creado", en: "Component created" },
  { ns: "admin", key: "components.updated", es: "Componente actualizado", en: "Component updated" },
  { ns: "admin", key: "components.deleted", es: "Componente eliminado", en: "Component deleted" },
  { ns: "admin", key: "components.confirmDelete", es: "¿Eliminar este componente?", en: "Delete this component?" },
  { ns: "admin", key: "components.allLevels", es: "Todos los niveles", en: "All levels" },
  { ns: "admin", key: "components.version", es: "Versión", en: "Version" },
  { ns: "admin", key: "components.category", es: "Categoría", en: "Category" },
  { ns: "admin", key: "components.showMore", es: "Ver más", en: "Show more" },
  { ns: "admin", key: "components.showLess", es: "Ver menos", en: "Show less" },

  // ============ Admin Translations ============
  { ns: "admin", key: "translations.title", es: "Traducciones", en: "Translations" },
  { ns: "admin", key: "translations.description", es: "Gestiona las traducciones del sistema", en: "Manage system translations" },
  { ns: "admin", key: "translations.noTranslations", es: "No hay traducciones", en: "No translations found" },
  { ns: "admin", key: "translations.new", es: "Nueva traducción", en: "New translation" },
  { ns: "admin", key: "translations.edit", es: "Editar traducción", en: "Edit translation" },
  { ns: "admin", key: "translations.created", es: "Traducción creada", en: "Translation created" },
  { ns: "admin", key: "translations.updated", es: "Traducción actualizada", en: "Translation updated" },
  { ns: "admin", key: "translations.deleted", es: "Traducción eliminada", en: "Translation deleted" },
  { ns: "admin", key: "translations.confirmDelete", es: "¿Eliminar esta traducción?", en: "Delete this translation?" },
  { ns: "admin", key: "translations.namespace", es: "Namespace", en: "Namespace" },
  { ns: "admin", key: "translations.key", es: "Clave", en: "Key" },
  { ns: "admin", key: "translations.value", es: "Valor", en: "Value" },
  { ns: "admin", key: "translations.language", es: "Idioma", en: "Language" },
  { ns: "admin", key: "translations.export", es: "Exportar", en: "Export" },
  { ns: "admin", key: "translations.import", es: "Importar", en: "Import" },
  { ns: "admin", key: "translations.scan", es: "Escanear claves", en: "Scan keys" },
  { ns: "admin", key: "translations.autoTranslate", es: "Auto traducir", en: "Auto translate" },
  { ns: "admin", key: "translations.missing", es: "Faltantes", en: "Missing" },
  { ns: "admin", key: "translations.all", es: "Todas", en: "All" },
  { ns: "admin", key: "translations.filterByNs", es: "Filtrar por namespace", en: "Filter by namespace" },
  { ns: "admin", key: "translations.filterByLang", es: "Filtrar por idioma", en: "Filter by language" },
  { ns: "admin", key: "translations.total", es: "Total", en: "Total" },
  { ns: "admin", key: "translations.translated", es: "Traducidas", en: "Translated" },
  { ns: "admin", key: "translations.pending", es: "Pendientes", en: "Pending" },

  // ============ Admin Agents ============
  { ns: "admin", key: "agents.title", es: "Agentes IA", en: "AI Agents" },
  { ns: "admin", key: "agents.description", es: "Gestiona los agentes de inteligencia artificial", en: "Manage AI agents" },
  { ns: "admin", key: "agents.noAgents", es: "No hay agentes", en: "No agents found" },
  { ns: "admin", key: "agents.new", es: "Nuevo agente", en: "New agent" },
  { ns: "admin", key: "agents.edit", es: "Editar agente", en: "Edit agent" },
  { ns: "admin", key: "agents.created", es: "Agente creado", en: "Agent created" },
  { ns: "admin", key: "agents.updated", es: "Agente actualizado", en: "Agent updated" },
  { ns: "admin", key: "agents.deleted", es: "Agente eliminado", en: "Agent deleted" },
  { ns: "admin", key: "agents.confirmDelete", es: "¿Eliminar este agente?", en: "Delete this agent?" },
  { ns: "admin", key: "agents.name", es: "Nombre", en: "Name" },
  { ns: "admin", key: "agents.systemPrompt", es: "System Prompt", en: "System Prompt" },
  { ns: "admin", key: "agents.model", es: "Modelo", en: "Model" },
  { ns: "admin", key: "agents.temperature", es: "Temperatura", en: "Temperature" },
  { ns: "admin", key: "agents.maxTokens", es: "Max Tokens", en: "Max Tokens" },
  { ns: "admin", key: "agents.enabled", es: "Habilitado", en: "Enabled" },
  { ns: "admin", key: "agents.disabled", es: "Deshabilitado", en: "Disabled" },
  { ns: "admin", key: "agents.test", es: "Probar", en: "Test" },
  { ns: "admin", key: "agents.duplicate", es: "Duplicar", en: "Duplicate" },

  // ============ Admin Users ============
  { ns: "admin", key: "users.title", es: "Usuarios", en: "Users" },
  { ns: "admin", key: "users.description", es: "Gestiona los usuarios del sistema", en: "Manage system users" },
  { ns: "admin", key: "users.noUsers", es: "No hay usuarios", en: "No users found" },
  { ns: "admin", key: "users.new", es: "Nuevo usuario", en: "New user" },
  { ns: "admin", key: "users.edit", es: "Editar usuario", en: "Edit user" },
  { ns: "admin", key: "users.created", es: "Usuario creado", en: "User created" },
  { ns: "admin", key: "users.updated", es: "Usuario actualizado", en: "User updated" },
  { ns: "admin", key: "users.deleted", es: "Usuario eliminado", en: "User deleted" },
  { ns: "admin", key: "users.confirmDelete", es: "¿Eliminar este usuario?", en: "Delete this user?" },
  { ns: "admin", key: "users.email", es: "Email", en: "Email" },
  { ns: "admin", key: "users.password", es: "Contraseña", en: "Password" },
  { ns: "admin", key: "users.role", es: "Rol", en: "Role" },
  { ns: "admin", key: "users.active", es: "Activo", en: "Active" },
  { ns: "admin", key: "users.inactive", es: "Inactivo", en: "Inactive" },
  { ns: "admin", key: "users.lastLogin", es: "Último acceso", en: "Last login" },
  { ns: "admin", key: "users.createdAt", es: "Fecha de creación", en: "Created at" },

  // ============ Admin Settings ============
  { ns: "admin", key: "settings.title", es: "Configuración", en: "Settings" },
  { ns: "admin", key: "settings.description", es: "Configuración general del sistema", en: "General system settings" },
  { ns: "admin", key: "settings.general", es: "General", en: "General" },
  { ns: "admin", key: "settings.appearance", es: "Apariencia", en: "Appearance" },
  { ns: "admin", key: "settings.security", es: "Seguridad", en: "Security" },
  { ns: "admin", key: "settings.integrations", es: "Integraciones", en: "Integrations" },
  { ns: "admin", key: "settings.saved", es: "Configuración guardada", en: "Settings saved" },
  { ns: "admin", key: "settings.siteName", es: "Nombre del sitio", en: "Site name" },
  { ns: "admin", key: "settings.siteDescription", es: "Descripción del sitio", en: "Site description" },
  { ns: "admin", key: "settings.defaultLanguage", es: "Idioma predeterminado", en: "Default language" },
  { ns: "admin", key: "settings.timezone", es: "Zona horaria", en: "Timezone" },
  { ns: "admin", key: "settings.theme", es: "Tema", en: "Theme" },
  { ns: "admin", key: "settings.light", es: "Claro", en: "Light" },
  { ns: "admin", key: "settings.dark", es: "Oscuro", en: "Dark" },
  { ns: "admin", key: "settings.auto", es: "Automático", en: "Auto" },

  // ============ Admin Dashboard ============
  { ns: "admin", key: "dashboard.title", es: "Dashboard", en: "Dashboard" },
  { ns: "admin", key: "dashboard.description", es: "Resumen general del sistema", en: "System overview" },
  { ns: "admin", key: "dashboard.totalUsers", es: "Total usuarios", en: "Total users" },
  { ns: "admin", key: "dashboard.totalPages", es: "Total páginas", en: "Total pages" },
  { ns: "admin", key: "dashboard.totalComponents", es: "Total componentes", en: "Total components" },
  { ns: "admin", key: "dashboard.totalAgents", es: "Total agentes", en: "Total agents" },
  { ns: "admin", key: "dashboard.recentActivity", es: "Actividad reciente", en: "Recent activity" },
  { ns: "admin", key: "dashboard.quickActions", es: "Acciones rápidas", en: "Quick actions" },
  { ns: "admin", key: "dashboard.systemStatus", es: "Estado del sistema", en: "System status" },
  { ns: "admin", key: "dashboard.healthy", es: "Saludable", en: "Healthy" },
  { ns: "admin", key: "dashboard.warning", es: "Advertencia", en: "Warning" },
  { ns: "admin", key: "dashboard.critical", es: "Crítico", en: "Critical" },
];

async function main() {
  console.log("🌐 Iniciando seed de traducciones del admin...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const t of translations) {
    // Español
    const existingEs = await prisma.translation.findFirst({
      where: { ns: t.ns, key: t.key, lang: "es" },
    });
    if (existingEs) {
      if (existingEs.value !== t.es) {
        await prisma.translation.update({
          where: { id: existingEs.id },
          data: { value: t.es },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      await prisma.translation.create({
        data: { ns: t.ns, key: t.key, lang: "es", value: t.es },
      });
      created++;
    }

    // Inglés
    const existingEn = await prisma.translation.findFirst({
      where: { ns: t.ns, key: t.key, lang: "en" },
    });
    if (existingEn) {
      if (existingEn.value !== t.en) {
        await prisma.translation.update({
          where: { id: existingEn.id },
          data: { value: t.en },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      await prisma.translation.create({
        data: { ns: t.ns, key: t.key, lang: "en", value: t.en },
      });
      created++;
    }
  }

  console.log(`✅ Traducciones procesadas:`);
  console.log(`   - Creadas: ${created}`);
  console.log(`   - Actualizadas: ${updated}`);
  console.log(`   - Sin cambios: ${skipped}`);
  console.log(`   - Total: ${translations.length * 2} (es + en)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
