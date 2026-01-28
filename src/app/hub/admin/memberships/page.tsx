"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FolderKanban,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  User,
  Building2,
  Coins,
  ShieldCheck,
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
} from "@/components/admin/AdminPage";

/* =========================================================
   🎫 Rowi Admin — Memberships Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface MembershipData {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  planId?: string;
  tokenQuota: number;
  tokenUsed: number;
  status: string;
  user?: { id: string; name?: string; email: string };
  tenant?: { id: string; name: string };
  plan?: { id: string; name: string };
}

const ROLE_OPTIONS = [
  { value: "SUPERADMIN", labelKey: "admin.memberships.role.superadmin" },
  { value: "ADMIN", labelKey: "admin.memberships.role.admin" },
  { value: "MANAGER", labelKey: "admin.memberships.role.manager" },
  { value: "EDITOR", labelKey: "admin.memberships.role.editor" },
  { value: "VIEWER", labelKey: "admin.memberships.role.viewer" },
];

export default function MembershipsPage() {
  const { t, ready } = useI18n();
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    userId: string;
    tenantId: string;
    role: string;
    planId: string;
    tokenQuota: number;
    tokenUsed: number;
    status: string;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [mem, usr, ten, pln] = await Promise.all([
        fetch("/api/admin/memberships").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/tenants").then((r) => r.json()),
        fetch("/api/admin/plans").then((r) => r.json()),
      ]);

      setMemberships(Array.isArray(mem) ? mem : mem?.memberships || []);
      setUsers(Array.isArray(usr) ? usr : usr?.users || []);
      setTenants(Array.isArray(ten) ? ten : ten?.tenants || []);
      setPlans(Array.isArray(pln) ? pln : pln?.plans || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadData();
  }, [ready]);

  function openCreate() {
    setEditor({
      mode: "create",
      userId: "",
      tenantId: "",
      role: "VIEWER",
      planId: "",
      tokenQuota: 0,
      tokenUsed: 0,
      status: "active",
    });
  }

  function openEdit(m: MembershipData) {
    setEditor({
      mode: "edit",
      id: m.id,
      userId: m.userId,
      tenantId: m.tenantId,
      role: m.role,
      planId: m.planId || "",
      tokenQuota: m.tokenQuota,
      tokenUsed: m.tokenUsed,
      status: m.status,
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.userId || !editor.tenantId) {
      toast.error(t("admin.memberships.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "create" ? "POST" : "PUT";
      const res = await fetch("/api/admin/memberships", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editor),
      });

      if (!res.ok) throw new Error();

      toast.success(editor.mode === "create" ? t("admin.memberships.created") : t("admin.memberships.updated"));
      setEditor(null);
      loadData();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMembership(id: string) {
    if (!confirm(t("admin.memberships.confirmDelete"))) return;
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.memberships.deleted"));
      loadData();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filtered = memberships.filter(
    (m) =>
      (m.user?.name || m.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.tenant?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  function getRoleColor(role: string) {
    switch (role) {
      case "SUPERADMIN": return "danger";
      case "ADMIN": return "warning";
      case "MANAGER": return "info";
      case "EDITOR": return "success";
      case "VIEWER": return "default";
      default: return "default";
    }
  }

  return (
    <AdminPage
      titleKey="admin.memberships.title"
      descriptionKey="admin.memberships.description"
      icon={FolderKanban}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.memberships.new")}
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
              {editor.mode === "create" ? t("admin.memberships.new") : t("admin.memberships.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminSelect
              value={editor.userId}
              onChange={(v) => setEditor({ ...editor, userId: v })}
              options={[
                { value: "", label: t("admin.memberships.selectUser") },
                ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
              ]}
            />
            <AdminSelect
              value={editor.tenantId}
              onChange={(v) => setEditor({ ...editor, tenantId: v })}
              options={[
                { value: "", label: t("admin.memberships.selectTenant") },
                ...tenants.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
            <AdminSelect
              value={editor.role}
              onChange={(v) => setEditor({ ...editor, role: v })}
              options={ROLE_OPTIONS.map((r) => ({ value: r.value, label: t(r.labelKey) }))}
            />
            <AdminSelect
              value={editor.planId}
              onChange={(v) => setEditor({ ...editor, planId: v })}
              options={[
                { value: "", label: t("admin.memberships.inheritPlan") },
                ...plans.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <AdminInput
              placeholderKey="admin.memberships.tokenQuota"
              value={String(editor.tokenQuota)}
              onChange={(v) => setEditor({ ...editor, tokenQuota: parseInt(v) || 0 })}
              type="number"
            />
            <AdminInput
              placeholderKey="admin.memberships.tokenUsed"
              value={String(editor.tokenUsed)}
              onChange={(v) => setEditor({ ...editor, tokenUsed: parseInt(v) || 0 })}
              type="number"
            />
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

      {/* Memberships List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={FolderKanban}
          titleKey="admin.memberships.noMemberships"
          descriptionKey="admin.memberships.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((m) => (
            <AdminListItem
              key={m.id}
              icon={User}
              title={m.user?.name || m.user?.email || t("admin.memberships.noUser")}
              subtitle={
                <span className="flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  {m.tenant?.name || "—"}
                </span>
              }
              badge={
                <AdminBadge variant={getRoleColor(m.role)}>
                  {m.role}
                </AdminBadge>
              }
              meta={
                <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {m.tokenUsed}/{m.tokenQuota}
                  </span>
                  {m.plan && (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {m.plan.name}
                    </span>
                  )}
                </div>
              }
              actions={
                <>
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(m)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteMembership(m.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((m) => (
            <AdminCard key={m.id} compact className="group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <AdminBadge variant={getRoleColor(m.role)}>
                  {m.role}
                </AdminBadge>
              </div>

              <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                {m.user?.name || m.user?.email || t("admin.memberships.noUser")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)] flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {m.tenant?.name || "—"}
              </p>

              <div className="flex gap-3 mt-3 pt-2 border-t border-[var(--rowi-border)]">
                <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                  <Coins className="w-3 h-3" />
                  {m.tokenUsed}/{m.tokenQuota}
                </div>
                {m.plan && (
                  <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                    <ShieldCheck className="w-3 h-3" />
                    {m.plan.name}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminIconButton icon={Pencil} onClick={() => openEdit(m)} />
                <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteMembership(m.id)} />
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
