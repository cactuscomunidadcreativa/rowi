"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ShieldCheck,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Sparkles,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminList,
  AdminListItem,
  AdminButton,
  AdminBadge,
  AdminEmpty,
  AdminViewToggle,
  AdminSearch,
  AdminInput,
  AdminSelect,
  AdminIconButton,
  AdminTextarea,
} from "@/components/admin/AdminPage";

/* =========================================================
   🛡️ Rowi Admin — Roles Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

type RoleDynamic = {
  id: string;
  name: string;
  level: "SYSTEM" | "SUPERHUB" | "HUB" | "TENANT" | "PLAN";
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

const RoleSchema = z.object({
  name: z.string().min(2).max(40),
  level: z.enum(["SYSTEM", "SUPERHUB", "HUB", "TENANT", "PLAN"]),
  description: z.string().max(400).optional().nullable(),
  permissions: z.string().optional().nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
});

const PERMISSION_OPTIONS = [
  { key: "viewMembers", labelKey: "admin.roles.perm.viewMembers" },
  { key: "editMembers", labelKey: "admin.roles.perm.editMembers" },
  { key: "assignTasks", labelKey: "admin.roles.perm.assignTasks" },
  { key: "viewReports", labelKey: "admin.roles.perm.viewReports" },
  { key: "managePayments", labelKey: "admin.roles.perm.managePayments" },
  { key: "useAI", labelKey: "admin.roles.perm.useAI" },
  { key: "viewEQ", labelKey: "admin.roles.perm.viewEQ" },
];

const LEVEL_OPTIONS = [
  { value: "SYSTEM", labelKey: "admin.roles.level.system" },
  { value: "SUPERHUB", labelKey: "admin.roles.level.superhub" },
  { value: "HUB", labelKey: "admin.roles.level.hub" },
  { value: "TENANT", labelKey: "admin.roles.level.tenant" },
  { value: "PLAN", labelKey: "admin.roles.level.plan" },
];

export default function HubRolesClient() {
  const { t, ready } = useI18n();
  const [roles, setRoles] = useState<RoleDynamic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    level: string;
    description: string;
    permissions: string[];
    color: string;
    icon: string;
  } | null>(null);

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
    if (ready) loadRoles();
  }, [ready]);

  function openCreate() {
    setEditor({
      mode: "create",
      name: "",
      level: "HUB",
      description: "",
      permissions: ["viewMembers"],
      color: "#4f46e5",
      icon: "Sparkles",
    });
  }

  function openEdit(role: RoleDynamic) {
    let perms: string[] = [];
    try {
      perms = JSON.parse(role.permissions || "[]");
    } catch {
      perms = [];
    }
    setEditor({
      mode: "edit",
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description || "",
      permissions: perms,
      color: role.color || "#4f46e5",
      icon: role.icon || "",
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.name) {
      toast.error(t("admin.roles.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editor.id,
        name: editor.name,
        level: editor.level,
        description: editor.description || null,
        permissions: JSON.stringify(editor.permissions),
        color: editor.color || null,
        icon: editor.icon || null,
      };

      RoleSchema.parse(payload);

      const method = editor.mode === "create" ? "POST" : "PUT";
      const res = await fetch("/api/admin/roles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      toast.success(editor.mode === "create" ? t("admin.roles.created") : t("admin.roles.updated"));
      setEditor(null);
      loadRoles();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(id: string) {
    if (!confirm(t("admin.roles.confirmDelete"))) return;
    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.roles.deleted"));
      loadRoles();
    } catch {
      toast.error(t("common.error"));
    }
  }

  function togglePermission(key: string) {
    if (!editor) return;
    const updated = editor.permissions.includes(key)
      ? editor.permissions.filter((p) => p !== key)
      : [...editor.permissions, key];
    setEditor({ ...editor, permissions: updated });
  }

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.level.toLowerCase().includes(search.toLowerCase())
  );

  function getLevelColor(level: string) {
    switch (level) {
      case "SYSTEM": return "danger";
      case "SUPERHUB": return "warning";
      case "HUB": return "info";
      case "TENANT": return "success";
      case "PLAN": return "default";
      default: return "default";
    }
  }

  return (
    <AdminPage
      titleKey="admin.roles.title"
      descriptionKey="admin.roles.description"
      icon={ShieldCheck}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadRoles} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.roles.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Editor Form */}
      {editor && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              {editor.mode === "create" ? (
                <PlusCircle className="w-4 h-4 text-white" />
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editor.mode === "create" ? t("admin.roles.new") : t("admin.roles.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminInput
              placeholderKey="admin.roles.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v })}
            />
            <AdminSelect
              value={editor.level}
              onChange={(v) => setEditor({ ...editor, level: v })}
              options={LEVEL_OPTIONS.map((l) => ({ value: l.value, label: t(l.labelKey) }))}
            />
            <AdminInput
              placeholderKey="admin.roles.color"
              value={editor.color}
              onChange={(v) => setEditor({ ...editor, color: v })}
            />
            <AdminInput
              placeholderKey="admin.roles.icon"
              value={editor.icon}
              onChange={(v) => setEditor({ ...editor, icon: v })}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.roles.descriptionPlaceholder"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-[var(--rowi-foreground)] mb-2">
              {t("admin.roles.permissions")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => togglePermission(opt.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    editor.permissions.includes(opt.key)
                      ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
                      : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
                  }`}
                >
                  {editor.permissions.includes(opt.key) && <Check className="w-3 h-3" />}
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editor.mode === "create" ? t("admin.common.create") : t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Roles List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={ShieldCheck}
          titleKey="admin.roles.noRoles"
          descriptionKey="admin.roles.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((role) => {
            let perms: string[] = [];
            try {
              perms = JSON.parse(role.permissions || "[]");
            } catch {
              perms = [];
            }
            return (
              <AdminListItem
                key={role.id}
                icon={ShieldCheck}
                title={role.name}
                subtitle={role.description || ""}
                badge={
                  <AdminBadge variant={getLevelColor(role.level)}>
                    {role.level}
                  </AdminBadge>
                }
                meta={
                  <div className="flex items-center gap-3">
                    {role.color && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-[10px] font-mono text-[var(--rowi-muted)]">
                          {role.color}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-[var(--rowi-muted)]">
                      {perms.length} {t("admin.roles.permissionsCount")}
                    </span>
                  </div>
                }
                actions={
                  <>
                    <AdminIconButton icon={Pencil} onClick={() => openEdit(role)} title={t("admin.common.edit")} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteRole(role.id)} title={t("admin.common.delete")} />
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((role) => {
            let perms: string[] = [];
            try {
              perms = JSON.parse(role.permissions || "[]");
            } catch {
              perms = [];
            }
            return (
              <AdminCard key={role.id} compact className="group">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: role.color || "var(--rowi-primary)" }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <AdminBadge variant={getLevelColor(role.level)}>
                    {role.level}
                  </AdminBadge>
                </div>

                <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                  {role.name}
                </h3>
                {role.description && (
                  <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">
                    {role.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)]">
                  {perms.slice(0, 3).map((p) => (
                    <span key={p} className="text-[9px] px-1.5 py-0.5 bg-[var(--rowi-border)] rounded text-[var(--rowi-muted)]">
                      {p}
                    </span>
                  ))}
                  {perms.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-[var(--rowi-border)] rounded text-[var(--rowi-muted)]">
                      +{perms.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(role)} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteRole(role.id)} />
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
