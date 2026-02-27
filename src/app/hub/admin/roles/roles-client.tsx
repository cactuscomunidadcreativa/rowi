"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Lock,
  X,
  ChevronDown,
  ChevronRight,
  Crown,
  User,
  Users,
  FileText,
  BarChart3,
  Settings,
  Zap,
  Database,
  MessageSquare,
  Eye,
  Shield,
  Save,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🛡️ Rowi Admin — Unified Roles & Permissions
   ---------------------------------------------------------
   Single page for managing roles with granular permissions.
   Uses /api/admin/roles (roleDynamic Prisma model).
========================================================= */

type RoleDynamic = {
  id: string;
  name: string;
  level: string;
  description?: string | null;
  permissions?: string | null;
  color?: string | null;
  icon?: string | null;
  hubId?: string | null;
  tenantId?: string | null;
  superHubId?: string | null;
  planId?: string | null;
  createdAt: string;
};

/* ── Permission definitions ── */
interface PermDef {
  key: string;
  name: string;
  desc: string;
  module: string;
}

const MODULES = [
  { key: "users", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "content", icon: FileText, color: "text-green-500", bg: "bg-green-500/10" },
  { key: "analytics", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
  { key: "settings", icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "ai", icon: Zap, color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "data", icon: Database, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { key: "messaging", icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

const MODULE_NAMES: Record<string, { es: string; en: string }> = {
  users: { es: "Usuarios", en: "Users" },
  content: { es: "Contenido", en: "Content" },
  analytics: { es: "Analíticas", en: "Analytics" },
  settings: { es: "Configuración", en: "Settings" },
  ai: { es: "Inteligencia Artificial", en: "AI" },
  data: { es: "Datos", en: "Data" },
  messaging: { es: "Mensajería", en: "Messaging" },
};

const ALL_PERMS: PermDef[] = [
  { key: "users.view", name: "Ver usuarios", desc: "Ver lista de usuarios", module: "users" },
  { key: "users.create", name: "Crear usuarios", desc: "Crear nuevos usuarios", module: "users" },
  { key: "users.edit", name: "Editar usuarios", desc: "Modificar datos", module: "users" },
  { key: "users.delete", name: "Eliminar usuarios", desc: "Eliminar usuarios", module: "users" },
  { key: "users.invite", name: "Invitar usuarios", desc: "Enviar invitaciones", module: "users" },
  { key: "content.view", name: "Ver contenido", desc: "Ver publicaciones y páginas", module: "content" },
  { key: "content.create", name: "Crear contenido", desc: "Crear publicaciones", module: "content" },
  { key: "content.edit", name: "Editar contenido", desc: "Modificar publicaciones", module: "content" },
  { key: "content.delete", name: "Eliminar contenido", desc: "Eliminar publicaciones", module: "content" },
  { key: "content.publish", name: "Publicar contenido", desc: "Publicar y despublicar", module: "content" },
  { key: "analytics.view", name: "Ver analytics", desc: "Ver reportes y métricas", module: "analytics" },
  { key: "analytics.export", name: "Exportar reportes", desc: "Exportar datos de reportes", module: "analytics" },
  { key: "settings.view", name: "Ver configuración", desc: "Ver ajustes del sistema", module: "settings" },
  { key: "settings.edit", name: "Editar configuración", desc: "Modificar ajustes", module: "settings" },
  { key: "ai.chat", name: "Usar chat IA", desc: "Interactuar con agentes IA", module: "ai" },
  { key: "ai.configure", name: "Configurar IA", desc: "Configurar agentes y modelos", module: "ai" },
  { key: "data.import", name: "Importar datos", desc: "Importar desde archivos", module: "data" },
  { key: "data.export", name: "Exportar datos", desc: "Exportar datos del sistema", module: "data" },
  { key: "messaging.send", name: "Enviar mensajes", desc: "Enviar comunicaciones", module: "messaging" },
  { key: "messaging.broadcast", name: "Broadcast", desc: "Enviar mensajes masivos", module: "messaging" },
];

const LEVEL_COLORS: Record<string, string> = {
  SYSTEM: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUPERHUB: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HUB: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TENANT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PLAN: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Crown,
  manager: Shield,
  viewer: Eye,
};

/* ── Helpers ── */
function parsePerms(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function HubRolesClient() {
  const { t, lang } = useI18n();
  const [roles, setRoles] = useState<RoleDynamic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<RoleDynamic | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(MODULES.map((m) => m.key));
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLevel, setNewLevel] = useState("HUB");
  const [newColor, setNewColor] = useState("#4f46e5");

  /* ── Load ── */
  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Select role ── */
  function selectRole(role: RoleDynamic) {
    setSelected(role);
    setEditPerms(parsePerms(role.permissions));
    setEditMode(false);
  }

  /* ── Save permissions ── */
  async function savePermissions() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          permissions: JSON.stringify(editPerms),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.roles.updated", "Rol actualizado"));
      setEditMode(false);
      loadRoles();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Create role ── */
  async function createRole() {
    if (!newName.trim()) {
      toast.error(t("admin.roles.requiredFields", "Nombre es requerido"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          level: newLevel,
          color: newColor,
          permissions: "[]",
          icon: "ShieldCheck",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.roles.created", "Rol creado"));
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewLevel("HUB");
      setNewColor("#4f46e5");
      loadRoles();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete role ── */
  async function deleteRole(id: string) {
    if (!confirm(t("admin.roles.confirmDelete", "¿Eliminar este rol?"))) return;
    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.roles.deleted", "Rol eliminado"));
      if (selected?.id === id) {
        setSelected(null);
        setEditPerms([]);
      }
      loadRoles();
    } catch {
      toast.error(t("common.error"));
    }
  }

  /* ── Permission toggles ── */
  function togglePerm(key: string) {
    if (!editMode) return;
    setEditPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function toggleModule(modKey: string) {
    setExpandedModules((prev) =>
      prev.includes(modKey) ? prev.filter((m) => m !== modKey) : [...prev, modKey]
    );
  }

  function toggleAllModulePerms(modKey: string) {
    if (!editMode) return;
    const modPerms = ALL_PERMS.filter((p) => p.module === modKey).map((p) => p.key);
    const allOn = modPerms.every((p) => editPerms.includes(p));
    if (allOn) {
      setEditPerms((prev) => prev.filter((p) => !modPerms.includes(p)));
    } else {
      setEditPerms((prev) => {
        const s = new Set(prev);
        modPerms.forEach((p) => s.add(p));
        return Array.from(s);
      });
    }
  }

  /* ── Render ── */
  const l = lang === "en" ? "en" : "es";

  function RoleIcon({ role }: { role: RoleDynamic }) {
    const slug = role.name.toLowerCase().replace(/\s+/g, "");
    const Ic = ROLE_ICONS[slug] || ShieldCheck;
    return <Ic className="w-4 h-4" />;
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--rowi-foreground)]">
              {l === "es" ? "Roles y Permisos" : "Roles & Permissions"}
            </h1>
            <p className="text-sm text-[var(--rowi-muted)]">
              {l === "es"
                ? "Gestiona roles y sus permisos granulares"
                : "Manage roles and their granular permissions"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRoles}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] hover:bg-[var(--rowi-background)] transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--rowi-g1,#6366f1)] to-[var(--rowi-g2,#8b5cf6)] text-white hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {l === "es" ? "Nuevo Rol" : "New Role"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
        </div>
      ) : roles.length === 0 ? (
        /* ── Empty state ── */
        <div className="text-center py-16 bg-[var(--rowi-surface)] rounded-xl border border-dashed border-[var(--rowi-border)]">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-[var(--rowi-muted)] opacity-40" />
          <h3 className="text-lg font-medium text-[var(--rowi-foreground)] mb-1">
            {l === "es" ? "No hay roles creados" : "No roles created"}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-4 max-w-sm mx-auto">
            {l === "es"
              ? "Crea tu primer rol para empezar a gestionar permisos en la plataforma."
              : "Create your first role to start managing permissions."}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[var(--rowi-g1,#6366f1)] to-[var(--rowi-g2,#8b5cf6)] text-white text-sm font-medium hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {l === "es" ? "Crear primer rol" : "Create first role"}
          </button>
        </div>
      ) : (
        /* ── Split layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Roles list ── */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-medium text-[var(--rowi-muted)] uppercase tracking-wide px-1 mb-2">
              {l === "es" ? "Roles" : "Roles"} ({roles.length})
            </p>
            {roles.map((role) => {
              const perms = parsePerms(role.permissions);
              const isActive = selected?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => selectRole(role)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5 shadow-sm"
                      : "border-[var(--rowi-border)] bg-[var(--rowi-surface)] hover:border-[var(--rowi-muted)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: role.color || "#4f46e5", color: "#fff" }}
                      >
                        <RoleIcon role={role} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-sm text-[var(--rowi-foreground)]">
                            {role.name}
                          </h4>
                          {role.level === "SYSTEM" && (
                            <Lock className="w-3 h-3 text-[var(--rowi-muted)]" />
                          )}
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-[var(--rowi-muted)] line-clamp-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        LEVEL_COLORS[role.level] || LEVEL_COLORS.PLAN
                      }`}
                    >
                      {role.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--rowi-border)]">
                    <span className="text-[11px] text-[var(--rowi-muted)]">
                      {perms.length} {l === "es" ? "permisos" : "permissions"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRole(role.id);
                        }}
                        className="p-1 rounded-md text-[var(--rowi-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Permissions panel ── */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-[var(--rowi-surface)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
                {/* Role header */}
                <div className="p-4 border-b border-[var(--rowi-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selected.color || "#4f46e5", color: "#fff" }}
                    >
                      <RoleIcon role={selected} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{selected.name}</h3>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        {selected.description || (l === "es" ? "Sin descripción" : "No description")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => {
                            setEditPerms(parsePerms(selected.permissions));
                            setEditMode(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--rowi-border)] hover:bg-[var(--rowi-background)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          {l === "es" ? "Cancelar" : "Cancel"}
                        </button>
                        <button
                          onClick={savePermissions}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {l === "es" ? "Guardar" : "Save"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {l === "es" ? "Editar permisos" : "Edit permissions"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Permission summary */}
                <div className="px-4 py-2.5 border-b border-[var(--rowi-border)] bg-[var(--rowi-background)]">
                  <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)]">
                    <span>
                      <strong className="text-[var(--rowi-foreground)]">{editPerms.length}</strong>{" "}
                      / {ALL_PERMS.length} {l === "es" ? "permisos activos" : "active permissions"}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${LEVEL_COLORS[selected.level] || ""}`}>
                      {selected.level}
                    </span>
                    {editMode && (
                      <span className="text-amber-500 font-medium animate-pulse">
                        {l === "es" ? "✏️ Editando" : "✏️ Editing"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Permission modules */}
                <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                  {MODULES.map((mod) => {
                    const modPerms = ALL_PERMS.filter((p) => p.module === mod.key);
                    const activeCount = modPerms.filter((p) => editPerms.includes(p.key)).length;
                    const allOn = activeCount === modPerms.length;
                    const isExpanded = expandedModules.includes(mod.key);
                    const Icon = mod.icon;

                    return (
                      <div
                        key={mod.key}
                        className="border border-[var(--rowi-border)] rounded-xl overflow-hidden"
                      >
                        {/* Module header */}
                        <div
                          className="flex items-center justify-between p-3 bg-[var(--rowi-background)] cursor-pointer"
                          onClick={() => toggleModule(mod.key)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Module-level toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllModulePerms(mod.key);
                              }}
                              disabled={!editMode}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                allOn
                                  ? "bg-[var(--rowi-primary)] border-[var(--rowi-primary)]"
                                  : activeCount > 0
                                  ? "bg-[var(--rowi-primary)]/50 border-[var(--rowi-primary)]/50"
                                  : "border-[var(--rowi-border)] bg-[var(--rowi-surface)]"
                              } ${!editMode ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--rowi-primary)]"}`}
                            >
                              {(allOn || activeCount > 0) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <div className={`p-1.5 rounded-md ${mod.bg}`}>
                              <Icon className={`w-3.5 h-3.5 ${mod.color}`} />
                            </div>
                            <span className="font-medium text-sm text-[var(--rowi-foreground)]">
                              {MODULE_NAMES[mod.key]?.[l] || mod.key}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--rowi-muted)] tabular-nums">
                              {activeCount}/{modPerms.length}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[var(--rowi-muted)]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[var(--rowi-muted)]" />
                            )}
                          </div>
                        </div>

                        {/* Individual permissions */}
                        {isExpanded && (
                          <div className="p-2 space-y-0.5">
                            {modPerms.map((perm) => {
                              const isOn = editPerms.includes(perm.key);
                              return (
                                <div
                                  key={perm.key}
                                  onClick={() => togglePerm(perm.key)}
                                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                    editMode
                                      ? "cursor-pointer hover:bg-[var(--rowi-background)]"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      isOn
                                        ? "bg-[var(--rowi-primary)] border-[var(--rowi-primary)]"
                                        : "border-[var(--rowi-border)]"
                                    } ${!editMode ? "opacity-40" : ""}`}
                                  >
                                    {isOn && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--rowi-foreground)]">
                                      {perm.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--rowi-muted)]">
                                      {perm.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── No selection state ── */
              <div className="bg-[var(--rowi-surface)] rounded-xl border border-[var(--rowi-border)] p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--rowi-muted)] opacity-30" />
                <p className="text-[var(--rowi-muted)]">
                  {l === "es"
                    ? "Selecciona un rol para ver y editar sus permisos"
                    : "Select a role to view and edit its permissions"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--rowi-surface)] rounded-xl border border-[var(--rowi-border)] shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rowi-border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--rowi-foreground)]">
                  {l === "es" ? "Nuevo Rol" : "New Role"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--rowi-background)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--rowi-muted)]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">
                  {l === "es" ? "Nombre del rol" : "Role name"} *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={l === "es" ? "ej. Coordinador" : "e.g. Coordinator"}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rowi-primary)]/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">
                  {l === "es" ? "Descripción" : "Description"}
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={l === "es" ? "¿Qué hace este rol?" : "What does this role do?"}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rowi-primary)]/20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">
                    {l === "es" ? "Nivel" : "Level"}
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm focus:border-[var(--rowi-primary)] focus:outline-none"
                  >
                    <option value="SYSTEM">System</option>
                    <option value="SUPERHUB">SuperHub</option>
                    <option value="HUB">Hub</option>
                    <option value="TENANT">Tenant</option>
                    <option value="PLAN">Plan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1.5 block">
                    {l === "es" ? "Color" : "Color"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-[var(--rowi-border)] cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm font-mono focus:border-[var(--rowi-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 border-t border-[var(--rowi-border)] flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--rowi-border)] hover:bg-[var(--rowi-background)] transition-colors"
              >
                {l === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={createRole}
                disabled={saving || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--rowi-g1,#6366f1)] to-[var(--rowi-g2,#8b5cf6)] text-white hover:shadow-md transition-all disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {l === "es" ? "Crear rol" : "Create role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
