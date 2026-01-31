"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  RefreshCcw,
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Info,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Settings,
  Database,
  FileText,
  MessageSquare,
  BarChart3,
  Zap,
  Crown,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🔐 Roles & Permissions Admin - Gestión de Roles
   =========================================================
   Permite crear, editar y gestionar roles con permisos
   granulares para diferentes módulos del sistema.
========================================================= */

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  isDefault: boolean;
  permissions: string[];
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

const PERMISSION_MODULES = [
  { key: "users", icon: Users, color: "text-blue-500" },
  { key: "content", icon: FileText, color: "text-green-500" },
  { key: "analytics", icon: BarChart3, color: "text-purple-500" },
  { key: "settings", icon: Settings, color: "text-amber-500" },
  { key: "ai", icon: Zap, color: "text-pink-500" },
  { key: "data", icon: Database, color: "text-cyan-500" },
  { key: "messaging", icon: MessageSquare, color: "text-indigo-500" },
];

const DEFAULT_PERMISSIONS: Permission[] = [
  // Users
  { id: "users.view", key: "users.view", name: "Ver usuarios", description: "Ver lista de usuarios", module: "users" },
  { id: "users.create", key: "users.create", name: "Crear usuarios", description: "Crear nuevos usuarios", module: "users" },
  { id: "users.edit", key: "users.edit", name: "Editar usuarios", description: "Modificar datos de usuarios", module: "users" },
  { id: "users.delete", key: "users.delete", name: "Eliminar usuarios", description: "Eliminar usuarios del sistema", module: "users" },
  { id: "users.invite", key: "users.invite", name: "Invitar usuarios", description: "Enviar invitaciones", module: "users" },
  // Content
  { id: "content.view", key: "content.view", name: "Ver contenido", description: "Ver publicaciones y páginas", module: "content" },
  { id: "content.create", key: "content.create", name: "Crear contenido", description: "Crear publicaciones", module: "content" },
  { id: "content.edit", key: "content.edit", name: "Editar contenido", description: "Modificar publicaciones", module: "content" },
  { id: "content.delete", key: "content.delete", name: "Eliminar contenido", description: "Eliminar publicaciones", module: "content" },
  { id: "content.publish", key: "content.publish", name: "Publicar contenido", description: "Publicar y despublicar", module: "content" },
  // Analytics
  { id: "analytics.view", key: "analytics.view", name: "Ver analytics", description: "Ver reportes y métricas", module: "analytics" },
  { id: "analytics.export", key: "analytics.export", name: "Exportar datos", description: "Exportar reportes", module: "analytics" },
  // Settings
  { id: "settings.view", key: "settings.view", name: "Ver configuración", description: "Ver ajustes del sistema", module: "settings" },
  { id: "settings.edit", key: "settings.edit", name: "Editar configuración", description: "Modificar ajustes", module: "settings" },
  // AI
  { id: "ai.chat", key: "ai.chat", name: "Usar chat IA", description: "Interactuar con agentes IA", module: "ai" },
  { id: "ai.configure", key: "ai.configure", name: "Configurar IA", description: "Configurar agentes y modelos", module: "ai" },
  // Data
  { id: "data.import", key: "data.import", name: "Importar datos", description: "Importar desde archivos", module: "data" },
  { id: "data.export", key: "data.export", name: "Exportar datos", description: "Exportar datos del sistema", module: "data" },
  // Messaging
  { id: "messaging.send", key: "messaging.send", name: "Enviar mensajes", description: "Enviar comunicaciones", module: "messaging" },
  { id: "messaging.broadcast", key: "messaging.broadcast", name: "Broadcast", description: "Enviar mensajes masivos", module: "messaging" },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrador",
    slug: "admin",
    description: "Acceso completo al sistema",
    isSystem: true,
    isDefault: false,
    permissions: DEFAULT_PERMISSIONS.map((p) => p.key),
    usersCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "manager",
    name: "Manager",
    slug: "manager",
    description: "Gestión de equipos y contenido",
    isSystem: true,
    isDefault: false,
    permissions: ["users.view", "users.edit", "content.view", "content.create", "content.edit", "content.publish", "analytics.view", "ai.chat", "messaging.send"],
    usersCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "member",
    name: "Miembro",
    slug: "member",
    description: "Usuario estándar",
    isSystem: true,
    isDefault: true,
    permissions: ["users.view", "content.view", "ai.chat"],
    usersCount: 48,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "viewer",
    name: "Observador",
    slug: "viewer",
    description: "Solo lectura",
    isSystem: true,
    isDefault: false,
    permissions: ["users.view", "content.view", "analytics.view"],
    usersCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function RolesPermissionsPage() {
  const { t } = useI18n();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(PERMISSION_MODULES.map((m) => m.key));
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/permissions/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || DEFAULT_ROLES);
      } else {
        setRoles(DEFAULT_ROLES);
      }
    } catch {
      setRoles(DEFAULT_ROLES);
    } finally {
      setLoading(false);
    }
  }

  async function saveRole() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/permissions/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRole),
      });

      if (res.ok) {
        toast.success(t("admin.roles.saveSuccess"));
        setEditMode(false);
        loadRoles();
      } else {
        toast.error(t("admin.roles.saveError"));
      }
    } catch {
      toast.error(t("admin.roles.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function createRole() {
    if (!newRole.name) {
      toast.error(t("admin.roles.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/permissions/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRole,
          slug: newRole.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (res.ok) {
        toast.success(t("admin.roles.createSuccess"));
        setShowNewRoleModal(false);
        setNewRole({ name: "", description: "", permissions: [] });
        loadRoles();
      } else {
        toast.error(t("admin.roles.createError"));
      }
    } catch {
      toast.error(t("admin.roles.createError"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(roleId: string) {
    if (!confirm(t("admin.roles.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/permissions/roles?id=${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t("admin.roles.deleteSuccess"));
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
        }
        loadRoles();
      } else {
        toast.error(t("admin.roles.deleteError"));
      }
    } catch {
      toast.error(t("admin.roles.deleteError"));
    }
  }

  function togglePermission(permKey: string) {
    if (!selectedRole || !editMode) return;

    setSelectedRole((prev) => {
      if (!prev) return prev;
      const hasPermission = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey],
      };
    });
  }

  function toggleModule(moduleKey: string) {
    setExpandedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  }

  function toggleAllModulePermissions(moduleKey: string) {
    if (!selectedRole || !editMode) return;

    const modulePerms = permissions.filter((p) => p.module === moduleKey).map((p) => p.key);
    const allSelected = modulePerms.every((p) => selectedRole.permissions.includes(p));

    setSelectedRole((prev) => {
      if (!prev) return prev;
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !modulePerms.includes(p)),
        };
      } else {
        const newPerms = [...prev.permissions];
        modulePerms.forEach((p) => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
        return { ...prev, permissions: newPerms };
      }
    });
  }

  const getRoleIcon = (role: Role) => {
    if (role.slug === "admin") return Crown;
    if (role.slug === "manager") return Shield;
    if (role.slug === "viewer") return Eye;
    return User;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-500" />
            {t("admin.roles.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">
            {t("admin.roles.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadRoles()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)]
              bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowNewRoleModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
              hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("admin.roles.newRole")}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-[var(--rowi-foreground)] font-medium">
            {t("admin.roles.infoTitle")}
          </p>
          <p className="text-[var(--rowi-muted)] mt-1">
            {t("admin.roles.infoDesc")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-[var(--rowi-muted)] px-1">
              {t("admin.roles.rolesList")} ({roles.length})
            </h3>
            {roles.map((role) => {
              const Icon = getRoleIcon(role);
              return (
                <div
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role);
                    setEditMode(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRole?.id === role.id
                      ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5"
                      : "border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:border-[var(--rowi-muted)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedRole?.id === role.id
                          ? "bg-[var(--rowi-primary)]/20"
                          : "bg-[var(--rowi-muted)]/10"
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          selectedRole?.id === role.id
                            ? "text-[var(--rowi-primary)]"
                            : "text-[var(--rowi-muted)]"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[var(--rowi-foreground)]">{role.name}</h4>
                          {role.isSystem && (
                            <Lock className="w-3 h-3 text-[var(--rowi-muted)]" />
                          )}
                          {role.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">
                              {t("admin.roles.default")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--rowi-muted)]">{role.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--rowi-border)]">
                    <span className="text-xs text-[var(--rowi-muted)]">
                      {role.usersCount} {t("admin.roles.users")}
                    </span>
                    <span className="text-xs text-[var(--rowi-muted)]">
                      {role.permissions.length} {t("admin.roles.permissions")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions Panel */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
                {/* Role Header */}
                <div className="p-5 border-b border-[var(--rowi-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                        {selectedRole.name}
                      </h3>
                      <p className="text-sm text-[var(--rowi-muted)]">{selectedRole.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!selectedRole.isSystem && (
                        <button
                          onClick={() => deleteRole(selectedRole.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {editMode ? (
                        <>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--rowi-border)] text-sm
                              hover:bg-[var(--rowi-muted)]/10 transition-colors"
                          >
                            {t("actions.cancel")}
                          </button>
                          <button
                            onClick={saveRole}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rowi-primary)] text-white text-sm
                              hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            {t("actions.save")}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] text-sm
                            hover:bg-[var(--rowi-primary)]/20 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          {t("actions.edit")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="p-5 max-h-[600px] overflow-y-auto">
                  <div className="space-y-4">
                    {PERMISSION_MODULES.map((module) => {
                      const modulePerms = permissions.filter((p) => p.module === module.key);
                      const selectedCount = modulePerms.filter((p) => selectedRole.permissions.includes(p.key)).length;
                      const allSelected = selectedCount === modulePerms.length;
                      const Icon = module.icon;
                      const isExpanded = expandedModules.includes(module.key);

                      return (
                        <div key={module.key} className="border border-[var(--rowi-border)] rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 bg-[var(--rowi-muted)]/5 cursor-pointer"
                            onClick={() => toggleModule(module.key)}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAllModulePermissions(module.key);
                                }}
                                disabled={!editMode}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  allSelected
                                    ? "bg-[var(--rowi-primary)] border-[var(--rowi-primary)]"
                                    : selectedCount > 0
                                    ? "bg-[var(--rowi-primary)]/50 border-[var(--rowi-primary)]/50"
                                    : "border-[var(--rowi-border)]"
                                } ${!editMode ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {(allSelected || selectedCount > 0) && <Check className="w-3 h-3 text-white" />}
                              </button>
                              <Icon className={`w-4 h-4 ${module.color}`} />
                              <span className="font-medium text-[var(--rowi-foreground)] capitalize">
                                {t(`admin.roles.modules.${module.key}`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--rowi-muted)]">
                                {selectedCount}/{modulePerms.length}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[var(--rowi-muted)]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[var(--rowi-muted)]" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 space-y-2">
                              {modulePerms.map((perm) => {
                                const isSelected = selectedRole.permissions.includes(perm.key);
                                return (
                                  <div
                                    key={perm.id}
                                    onClick={() => togglePermission(perm.key)}
                                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                      editMode ? "cursor-pointer hover:bg-[var(--rowi-muted)]/5" : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        isSelected
                                          ? "bg-[var(--rowi-primary)] border-[var(--rowi-primary)]"
                                          : "border-[var(--rowi-border)]"
                                      } ${!editMode ? "opacity-50" : ""}`}
                                    >
                                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-[var(--rowi-foreground)]">{perm.name}</p>
                                      <p className="text-xs text-[var(--rowi-muted)]">{perm.description}</p>
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
              </div>
            ) : (
              <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-12 text-center">
                <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--rowi-muted)] opacity-50" />
                <p className="text-[var(--rowi-muted)]">{t("admin.roles.selectRole")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {showNewRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] w-full max-w-md">
            <div className="p-5 border-b border-[var(--rowi-border)]">
              <h3 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                {t("admin.roles.newRole")}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                  {t("admin.roles.roleName")}
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("admin.roles.roleNamePlaceholder")}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                    text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                  {t("admin.roles.roleDescription")}
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t("admin.roles.roleDescriptionPlaceholder")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                    text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[var(--rowi-border)] flex justify-end gap-2">
              <button
                onClick={() => setShowNewRoleModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--rowi-border)]
                  hover:bg-[var(--rowi-muted)]/10 transition-colors"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={createRole}
                disabled={saving || !newRole.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
                  hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("actions.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
