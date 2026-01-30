"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Settings2,
  Users,
  Building2,
  Layers,
  Save,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminSelect,
  AdminToggle,
  AdminSearch,
  AdminTabs,
  AdminEmpty,
} from "@/components/admin/AdminPage";

/* =========================================================
   🎛️ Permissions Admin — Super Dropdown de Permisos

   Permite configurar qué ve cada perfil/rol de forma visual.
   - Seleccionar rol
   - Ver/editar features en categorías desplegables
   - Toggle para cada tipo de permiso (view, create, edit, delete)
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
  description?: string;
  isDefault?: boolean;
}

interface FeatureDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  parentKey?: string;
  icon?: string;
  route?: string;
  isAdmin: boolean;
  isDefault: boolean;
}

const ORG_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
const TENANT_ROLES = ["SUPERADMIN", "ADMIN", "MANAGER", "EDITOR", "VIEWER", "DEVELOPER", "BILLING", "FEDERATOR"];

export default function PermissionsPage() {
  const { t } = useI18n();

  // Estado principal
  const [roleType, setRoleType] = useState<"org" | "tenant">("org");
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [permissions, setPermissions] = useState<FeaturePermission[]>([]);
  const [definitions, setDefinitions] = useState<FeatureDefinition[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, FeaturePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Categorías expandidas
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["dashboard", "benchmarks"]));

  // Cambios pendientes
  const [pendingChanges, setPendingChanges] = useState<Map<string, FeaturePermission>>(new Map());

  // Cargar definiciones de features (solo una vez)
  useEffect(() => {
    const loadDefs = async () => {
      try {
        const res = await fetch("/api/admin/permissions/features/definitions");
        const data = await res.json();
        if (data.ok) {
          setDefinitions(data.definitions);
        }
      } catch (error) {
        console.error("Error loading definitions:", error);
      }
    };
    loadDefs();
  }, []);

  // Cargar permisos cuando cambia el rol
  useEffect(() => {
    const loadPerms = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/permissions/features?role=${selectedRole}&roleType=${roleType}&withDefaults=true`
        );
        const data = await res.json();
        if (data.ok) {
          setPermissions(data.permissions);
          setByCategory(data.byCategory || {});
        }
      } catch (error) {
        toast.error("Error al cargar permisos");
      } finally {
        setLoading(false);
      }
    };
    loadPerms();
    setPendingChanges(new Map());
  }, [selectedRole, roleType]);

  // Función para recargar manualmente
  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/permissions/features?role=${selectedRole}&roleType=${roleType}&withDefaults=true`
      );
      const data = await res.json();
      if (data.ok) {
        setPermissions(data.permissions);
        setByCategory(data.byCategory || {});
      }
    } catch (error) {
      toast.error("Error al cargar permisos");
    } finally {
      setLoading(false);
    }
  };

  const loadDefinitions = async () => {
    try {
      const res = await fetch("/api/admin/permissions/features/definitions");
      const data = await res.json();
      if (data.ok) {
        setDefinitions(data.definitions);
      }
    } catch (error) {
      console.error("Error loading definitions:", error);
    }
  };

  // Toggle categoría expandida
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Actualizar permiso localmente
  const updatePermission = (
    featureKey: string,
    field: "canView" | "canCreate" | "canEdit" | "canDelete",
    value: boolean
  ) => {
    // Encontrar el permiso actual
    const currentPerm = permissions.find((p) => p.featureKey === featureKey) || {
      role: selectedRole,
      roleType,
      featureKey,
      category: definitions.find((d) => d.key === featureKey)?.category || "general",
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };

    const updatedPerm = { ...currentPerm, [field]: value };

    // Si desactiva canView, desactivar todo
    if (field === "canView" && !value) {
      updatedPerm.canCreate = false;
      updatedPerm.canEdit = false;
      updatedPerm.canDelete = false;
    }

    // Guardar en cambios pendientes
    const newPending = new Map(pendingChanges);
    newPending.set(featureKey, updatedPerm);
    setPendingChanges(newPending);

    // Actualizar estado local
    setPermissions((prev) => {
      const idx = prev.findIndex((p) => p.featureKey === featureKey);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = updatedPerm;
        return updated;
      }
      return [...prev, updatedPerm];
    });

    // Actualizar byCategory
    setByCategory((prev) => {
      const cat = updatedPerm.category;
      const catPerms = [...(prev[cat] || [])];
      const catIdx = catPerms.findIndex((p) => p.featureKey === featureKey);
      if (catIdx >= 0) {
        catPerms[catIdx] = updatedPerm;
      } else {
        catPerms.push(updatedPerm);
      }
      return { ...prev, [cat]: catPerms };
    });
  };

  // Guardar cambios
  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    try {
      const permissionsToSave = Array.from(pendingChanges.values());
      const res = await fetch("/api/admin/permissions/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsToSave }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.permissions.saved"));
        setPendingChanges(new Map());
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  // Descartar cambios
  const discardChanges = () => {
    setPendingChanges(new Map());
    loadPermissions();
  };

  // Seed inicial
  const runSeed = async () => {
    try {
      const res = await fetch("/api/admin/permissions/features/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.permissions.seedSuccess"));
        loadDefinitions();
        loadPermissions();
      }
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  // Filtrar por búsqueda
  const filteredCategories = Object.entries(byCategory).filter(([category, perms]) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      category.toLowerCase().includes(searchLower) ||
      perms.some(
        (p) =>
          p.featureKey.toLowerCase().includes(searchLower) ||
          (p.description || "").toLowerCase().includes(searchLower)
      )
    );
  });

  const roles = roleType === "org" ? ORG_ROLES : TENANT_ROLES;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, typeof Shield> = {
      dashboard: Layers,
      benchmarks: Settings2,
      users: Users,
      organizations: Building2,
      permissions: Shield,
      default: Settings2,
    };
    return icons[category] || icons.default;
  };

  return (
    <AdminPage
      titleKey="admin.permissions.title"
      descriptionKey="admin.permissions.description"
      icon={Shield}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          {pendingChanges.size > 0 && (
            <>
              <AdminButton
                variant="ghost"
                icon={X}
                onClick={discardChanges}
                size="sm"
              >
                {t("admin.common.discard")}
              </AdminButton>
              <AdminButton
                variant="primary"
                icon={Save}
                onClick={saveChanges}
                loading={saving}
                size="sm"
              >
                {t("admin.common.save")} ({pendingChanges.size})
              </AdminButton>
            </>
          )}
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadPermissions} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {/* Controles superiores */}
      <AdminCard className="mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tipo de rol */}
          <div className="flex-1">
            <AdminTabs
              tabs={[
                { id: "org", labelKey: "admin.permissions.orgRoles" },
                { id: "tenant", labelKey: "admin.permissions.tenantRoles" },
              ]}
              activeTab={roleType}
              onChange={(tab) => {
                setRoleType(tab as "org" | "tenant");
                setSelectedRole(tab === "org" ? "ADMIN" : "ADMIN");
              }}
            />
          </div>

          {/* Selector de rol */}
          <div className="w-48">
            <AdminSelect
              labelKey="admin.permissions.selectRole"
              value={selectedRole}
              onChange={setSelectedRole}
              options={roles.map((r) => ({
                value: r,
                label: t(`admin.permissions.roles.${r.toLowerCase()}`),
              }))}
            />
          </div>

          {/* Búsqueda */}
          <div className="w-64">
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholderKey="admin.permissions.searchFeatures"
            />
          </div>
        </div>
      </AdminCard>

      {/* Info del rol */}
      <AdminCard compact className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--rowi-foreground)]">
                {t(`admin.permissions.roles.${selectedRole.toLowerCase()}`)}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t(`admin.permissions.roleDescriptions.${selectedRole.toLowerCase()}`)}
              </p>
            </div>
          </div>
          <AdminBadge variant={selectedRole === "OWNER" || selectedRole === "SUPERADMIN" ? "primary" : "neutral"}>
            {roleType.toUpperCase()}
          </AdminBadge>
        </div>
      </AdminCard>

      {/* Lista de features por categoría */}
      {filteredCategories.length === 0 ? (
        <AdminEmpty
          icon={Shield}
          titleKey="admin.permissions.noFeatures"
          descriptionKey="admin.permissions.runSeed"
          action={
            <AdminButton variant="primary" icon={Plus} onClick={runSeed}>
              {t("admin.permissions.initFeatures")}
            </AdminButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredCategories.map(([category, categoryPerms]) => {
            const CategoryIcon = getCategoryIcon(category);
            const isExpanded = expandedCategories.has(category);
            const enabledCount = categoryPerms.filter((p) => p.canView).length;

            return (
              <AdminCard key={category} compact className="overflow-hidden">
                {/* Header de categoría */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--rowi-background)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center">
                      <CategoryIcon className="w-4 h-4 text-[var(--rowi-primary)]" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-[var(--rowi-foreground)] capitalize">
                        {t(`admin.permissions.categories.${category}`)}
                      </h4>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        {enabledCount} / {categoryPerms.length} {t("admin.permissions.enabled")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminBadge variant={enabledCount > 0 ? "success" : "neutral"}>
                      {enabledCount > 0 ? t("admin.permissions.active") : t("admin.permissions.inactive")}
                    </AdminBadge>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--rowi-muted)]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--rowi-muted)]" />
                    )}
                  </div>
                </button>

                {/* Lista de features */}
                {isExpanded && (
                  <div className="border-t border-[var(--rowi-border)]">
                    {categoryPerms.map((perm) => {
                      const def = definitions.find((d) => d.key === perm.featureKey);
                      const hasChanges = pendingChanges.has(perm.featureKey);
                      const isChild = perm.featureKey.includes(".");

                      return (
                        <div
                          key={perm.featureKey}
                          className={`
                            flex items-center gap-4 px-4 py-3 border-b border-[var(--rowi-border)] last:border-b-0
                            hover:bg-[var(--rowi-background)] transition-colors
                            ${isChild ? "pl-12" : ""}
                            ${hasChanges ? "bg-[var(--rowi-warning)]/5" : ""}
                          `}
                        >
                          {/* Info de feature */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-[var(--rowi-foreground)]">
                                {t(`admin.permissions.features.${perm.featureKey.replace(/\./g, "_")}`)}
                              </span>
                              {def?.isAdmin && (
                                <AdminBadge variant="warning" size="sm">
                                  Admin
                                </AdminBadge>
                              )}
                              {hasChanges && (
                                <span className="w-2 h-2 rounded-full bg-[var(--rowi-warning)]" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--rowi-muted)] truncate">
                              {perm.description || def?.description || perm.featureKey}
                            </p>
                          </div>

                          {/* Toggles de permisos */}
                          <div className="flex items-center gap-6">
                            {/* Ver */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-[var(--rowi-muted)] uppercase">
                                {t("admin.permissions.canView")}
                              </span>
                              <button
                                onClick={() => updatePermission(perm.featureKey, "canView", !perm.canView)}
                                className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  ${perm.canView
                                    ? "bg-[var(--rowi-success)] text-white"
                                    : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
                                  }
                                `}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Crear */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-[var(--rowi-muted)] uppercase">
                                {t("admin.permissions.canCreate")}
                              </span>
                              <button
                                onClick={() => updatePermission(perm.featureKey, "canCreate", !perm.canCreate)}
                                disabled={!perm.canView}
                                className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  disabled:opacity-30 disabled:cursor-not-allowed
                                  ${perm.canCreate
                                    ? "bg-[var(--rowi-info)] text-white"
                                    : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
                                  }
                                `}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Editar */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-[var(--rowi-muted)] uppercase">
                                {t("admin.permissions.canEdit")}
                              </span>
                              <button
                                onClick={() => updatePermission(perm.featureKey, "canEdit", !perm.canEdit)}
                                disabled={!perm.canView}
                                className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  disabled:opacity-30 disabled:cursor-not-allowed
                                  ${perm.canEdit
                                    ? "bg-[var(--rowi-warning)] text-white"
                                    : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
                                  }
                                `}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Eliminar */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-[var(--rowi-muted)] uppercase">
                                {t("admin.permissions.canDelete")}
                              </span>
                              <button
                                onClick={() => updatePermission(perm.featureKey, "canDelete", !perm.canDelete)}
                                disabled={!perm.canView}
                                className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  disabled:opacity-30 disabled:cursor-not-allowed
                                  ${perm.canDelete
                                    ? "bg-[var(--rowi-error)] text-white"
                                    : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
                                  }
                                `}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Footer con acciones rápidas */}
      {pendingChanges.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--rowi-surface)] border border-[var(--rowi-border)] rounded-xl shadow-lg px-4 py-3 flex items-center gap-4 z-50">
          <span className="text-sm text-[var(--rowi-foreground)]">
            {pendingChanges.size} {t("admin.permissions.pendingChanges")}
          </span>
          <AdminButton variant="ghost" icon={X} onClick={discardChanges} size="sm">
            {t("admin.common.discard")}
          </AdminButton>
          <AdminButton variant="primary" icon={Save} onClick={saveChanges} loading={saving} size="sm">
            {t("admin.common.save")}
          </AdminButton>
        </div>
      )}
    </AdminPage>
  );
}
