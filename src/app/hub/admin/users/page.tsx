"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Eye,
  Download,
  Upload,
  Building2,
  Cpu,
  Sparkles,
  ShieldCheck,
  Trash2,
  Link2,
  AlertTriangle,
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
import UserInspector from "./components/UserInspector";
import ImportUserModal from "./components/ImportUserModal";

/* =========================================================
   👥 Rowi Admin — Users Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface UserData {
  id: string;
  name?: string;
  email?: string;
  organizationRole?: string;
  active?: boolean;
  allowAI?: boolean;
  primaryTenant?: { id: string; name: string };
  primaryTenantId?: string;
  plan?: { id: string; name: string };
  planId?: string;
  memberships?: any[];
  orgMemberships?: any[];
  hubs?: any[];
}

export default function UsersPage() {
  const { t, ready } = useI18n();
  const [users, setUsers] = useState<UserData[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [inspector, setInspector] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserData | null>(null);
  const [creator, setCreator] = useState<Partial<UserData> | null>(null);
  const [deleting, setDeleting] = useState<UserData | null>(null);
  const [merging, setMerging] = useState<UserData | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [usr, ten, pln, org, hub, shub] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/hub/tenants").then((r) => r.json()),
        fetch("/api/admin/plans").then((r) => r.json()),
        fetch("/api/hub/organizations").then((r) => r.json()),
        fetch("/api/hub/hubs").then((r) => r.json()),
        fetch("/api/hub/superhubs").then((r) => r.json()),
      ]);

      setUsers(Array.isArray(usr.users) ? usr.users : []);
      setTenants(ten.tenants || []);
      setPlans(pln.plans || []);
      setOrgs(org.organizations || []);
      setHubs(hub.hubs || []);
      setSuperHubs(shub.superHubs || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAll();
  }, [ready]);

  async function saveUser() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.users.updated"));
      setEditing(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.users.deleted", "Usuario eliminado"));
      setDeleting(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function mergeUsers(targetId: string) {
    if (!merging) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: merging.id, targetId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.users.merged", "Usuarios unidos correctamente"));
      setMerging(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    if (!creator?.name || !creator?.email) {
      toast.error(t("admin.users.requiredFields"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creator.name,
          email: creator.email,
          primaryTenantId: creator.primaryTenantId || tenants[0]?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t("admin.users.created"));
      setCreator(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function exportToCSV() {
    if (users.length === 0) {
      toast.warning(t("admin.users.noUsers"));
      return;
    }
    const headers = ["ID", "Nombre", "Email", "Rol", "Tenant", "Plan", "Activo", "IA"];
    const rows = users.map((u) => [
      u.id,
      u.name || "",
      u.email || "",
      u.organizationRole || "",
      u.primaryTenant?.name || "",
      u.plan?.name || "",
      u.active ? "Sí" : "No",
      u.allowAI ? "Sí" : "No",
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "usuarios_rowi.csv";
    link.click();
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.users.title"
      descriptionKey="admin.users.description"
      icon={Users}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadAll} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton variant="secondary" icon={Download} onClick={exportToCSV} size="sm">
            CSV
          </AdminButton>
          <ImportUserModal tenants={tenants} onComplete={loadAll} />
          <AdminButton
            icon={PlusCircle}
            size="sm"
            onClick={() =>
              setCreator({
                name: "",
                email: "",
                primaryTenantId: tenants[0]?.id || "",
              })
            }
          >
            {t("admin.users.new")}
          </AdminButton>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Users}
          titleKey="admin.users.noUsers"
          descriptionKey="admin.users.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((user) => (
            <AdminListItem
              key={user.id}
              icon={Users}
              title={user.name || t("admin.users.unnamed")}
              subtitle={user.email}
              badge={
                <div className="flex gap-1">
                  <AdminBadge variant={user.active ? "success" : "neutral"}>
                    {user.active ? t("admin.common.active") : t("admin.common.inactive")}
                  </AdminBadge>
                  {user.allowAI && (
                    <AdminBadge variant="primary">
                      <Sparkles className="w-3 h-3 mr-0.5" />AI
                    </AdminBadge>
                  )}
                </div>
              }
              meta={
                <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {user.primaryTenant?.name || "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {user.plan?.name || "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {user.organizationRole || "VIEWER"}
                  </span>
                </div>
              }
              actions={
                <>
                  <AdminIconButton icon={Eye} onClick={() => setInspector(user.id)} title={t("admin.common.view")} />
                  <AdminIconButton icon={Pencil} onClick={() => setEditing(user)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Link2} onClick={() => setMerging(user)} title={t("admin.users.merge", "Unir con otro")} />
                  <AdminIconButton icon={Trash2} onClick={() => setDeleting(user)} title={t("admin.common.delete")} className="text-red-500 hover:text-red-600" />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((user) => (
            <AdminCard key={user.id} compact className="group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex gap-1">
                  <AdminBadge variant={user.active ? "success" : "neutral"}>
                    {user.active ? "✓" : "—"}
                  </AdminBadge>
                  {user.allowAI && <AdminBadge variant="primary">AI</AdminBadge>}
                </div>
              </div>

              <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                {user.name || t("admin.users.unnamed")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)] truncate">{user.email}</p>

              <div className="mt-2 space-y-1 text-[10px] text-[var(--rowi-muted)]">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {user.primaryTenant?.name || "—"}
                </div>
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {user.plan?.name || "—"}
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {user.organizationRole || "VIEWER"}
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminButton variant="ghost" size="xs" icon={Eye} onClick={() => setInspector(user.id)}>
                  {t("admin.common.view")}
                </AdminButton>
                <AdminButton variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing(user)}>
                  {t("admin.common.edit")}
                </AdminButton>
                <AdminButton variant="ghost" size="xs" icon={Link2} onClick={() => setMerging(user)}>
                  {t("admin.users.merge", "Unir")}
                </AdminButton>
                <AdminButton variant="ghost" size="xs" icon={Trash2} onClick={() => setDeleting(user)} className="text-red-500">
                  {t("admin.common.delete")}
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}

      {/* Inspector Modal */}
      {inspector && <UserInspector userId={inspector} onClose={() => setInspector(null)} />}

      {/* Create/Edit Form */}
      {(creator || editing) && (
        <UserForm
          mode={creator ? "create" : "edit"}
          user={(creator || editing) as UserData}
          setUser={creator ? setCreator : setEditing}
          onSave={creator ? createUser : saveUser}
          onClose={() => { setCreator(null); setEditing(null); }}
          tenants={tenants}
          hubs={hubs}
          superHubs={superHubs}
          orgs={orgs}
          plans={plans}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <DeleteConfirmModal
          user={deleting}
          onConfirm={deleteUser}
          onClose={() => setDeleting(null)}
          saving={saving}
        />
      )}

      {/* Merge Users Modal */}
      {merging && (
        <MergeUsersModal
          sourceUser={merging}
          allUsers={users.filter(u => u.id !== merging.id)}
          onMerge={mergeUsers}
          onClose={() => setMerging(null)}
          saving={saving}
        />
      )}
    </AdminPage>
  );
}

/* =========================================================
   📝 UserForm — Create/Edit user modal
========================================================= */

function UserForm({
  mode,
  user,
  setUser,
  onSave,
  onClose,
  tenants,
  hubs,
  superHubs,
  orgs,
  plans,
  saving,
}: {
  mode: "create" | "edit";
  user: any;
  setUser: (u: any) => void;
  onSave: () => void;
  onClose: () => void;
  tenants: any[];
  hubs: any[];
  superHubs: any[];
  orgs: any[];
  plans: any[];
  saving: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--rowi-surface)] rounded-xl shadow-xl border border-[var(--rowi-border)]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-[var(--rowi-border)] bg-[var(--rowi-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {mode === "create" ? t("admin.users.new") : t("admin.users.edit")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminButton variant="ghost" size="sm" onClick={onClose}>{t("admin.common.cancel")}</AdminButton>
            <AdminButton onClick={onSave} loading={saving} size="sm">{t("admin.common.save")}</AdminButton>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              placeholderKey="admin.users.name"
              value={user.name || ""}
              onChange={(v) => setUser({ ...user, name: v })}
            />
            <AdminInput
              placeholderKey="admin.users.email"
              value={user.email || ""}
              onChange={(v) => setUser({ ...user, email: v })}
            />
          </div>

          {/* Role & Plan */}
          <div className="grid grid-cols-2 gap-3">
            <AdminSelect
              value={user.organizationRole || "VIEWER"}
              onChange={(v) => setUser({ ...user, organizationRole: v })}
              options={[
                { value: "SUPERADMIN", label: "Super Admin" },
                { value: "ADMIN", label: "Admin" },
                { value: "MANAGER", label: "Manager" },
                { value: "EDITOR", label: "Editor" },
                { value: "VIEWER", label: "Viewer" },
              ]}
            />
            <AdminSelect
              value={user.planId || ""}
              onChange={(v) => setUser({ ...user, planId: v })}
              options={[
                { value: "", label: t("admin.users.noPlan") },
                ...plans.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          {/* Hierarchy */}
          <div className="border-t border-[var(--rowi-border)] pt-4 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--rowi-foreground)]">{t("admin.users.hierarchy")}</h3>

            <AdminSelect
              value={user.primaryTenantId || ""}
              onChange={(v) => setUser({ ...user, primaryTenantId: v })}
              options={[
                { value: "", label: t("admin.users.noTenant") },
                ...tenants.map((t: any) => ({ value: t.id, label: t.name })),
              ]}
            />

            {user.hubs?.[0]?.superHub && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--rowi-background)] rounded text-xs">
                <span className="text-[var(--rowi-muted)]">SuperHub:</span>
                <span className="font-medium">{user.hubs[0].superHub.name}</span>
              </div>
            )}

            {user.hubs?.[0] && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--rowi-background)] rounded text-xs">
                <span className="text-[var(--rowi-muted)]">Hub:</span>
                <span className="font-medium">{user.hubs[0].name}</span>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between border-t border-[var(--rowi-border)] pt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!user.allowAI}
                onChange={(e) => setUser({ ...user, allowAI: e.target.checked })}
                className="rounded border-[var(--rowi-border)]"
              />
              <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
              {t("admin.users.aiEnabled")}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!user.active}
                onChange={(e) => setUser({ ...user, active: e.target.checked })}
                className="rounded border-[var(--rowi-border)]"
              />
              {t("admin.common.active")}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   🗑️ DeleteConfirmModal — Confirmar eliminación
========================================================= */
function DeleteConfirmModal({
  user,
  onConfirm,
  onClose,
  saving,
}: {
  user: UserData;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--rowi-surface)] rounded-xl shadow-xl border border-[var(--rowi-border)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
              {t("admin.users.confirmDelete", "¿Eliminar usuario?")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("admin.users.deleteWarning", "Esta acción no se puede deshacer")}
            </p>
          </div>
        </div>

        <div className="p-3 bg-[var(--rowi-background)] rounded-lg mb-4">
          <p className="font-medium text-[var(--rowi-foreground)]">{user.name}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{user.email}</p>
        </div>

        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>
            {t("admin.common.cancel")}
          </AdminButton>
          <AdminButton
            onClick={onConfirm}
            loading={saving}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {t("admin.common.delete")}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   🔗 MergeUsersModal — Unir dos usuarios
========================================================= */
function MergeUsersModal({
  sourceUser,
  allUsers,
  onMerge,
  onClose,
  saving,
}: {
  sourceUser: UserData;
  allUsers: UserData[];
  onMerge: (targetId: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[80vh] bg-[var(--rowi-surface)] rounded-xl shadow-xl border border-[var(--rowi-border)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--rowi-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                {t("admin.users.mergeTitle", "Unir usuarios")}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.users.mergeDesc", "Los datos de este usuario se moverán al usuario seleccionado")}
              </p>
            </div>
          </div>
        </div>

        {/* Source user */}
        <div className="p-4 border-b border-[var(--rowi-border)]">
          <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("admin.users.mergeFrom", "Usuario origen (se eliminará):")}</p>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="font-medium text-[var(--rowi-foreground)]">{sourceUser.name}</p>
            <p className="text-sm text-[var(--rowi-muted)]">{sourceUser.email}</p>
          </div>
        </div>

        {/* Search and select target */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("admin.users.mergeTo", "Usuario destino (conservará los datos):")}</p>

          <AdminSearch
            value={search}
            onChange={setSearch}
            className="w-full mb-3"
          />

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.slice(0, 20).map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedTarget(user.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTarget === user.id
                    ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/10"
                    : "border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50"
                }`}
              >
                <p className="font-medium text-[var(--rowi-foreground)]">{user.name}</p>
                <p className="text-sm text-[var(--rowi-muted)]">{user.email}</p>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-[var(--rowi-muted)] py-4">
                {t("admin.users.noResults", "No se encontraron usuarios")}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--rowi-border)] flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>
            {t("admin.common.cancel")}
          </AdminButton>
          <AdminButton
            onClick={() => selectedTarget && onMerge(selectedTarget)}
            loading={saving}
            disabled={!selectedTarget}
          >
            {t("admin.users.mergeConfirm", "Unir usuarios")}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
