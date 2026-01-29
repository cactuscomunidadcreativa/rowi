"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  RefreshCcw,
  Eye,
  UserCircle2,
  Link2,
  CheckCircle2,
  HeartHandshake,
  Mail,
  Clock,
  ArrowLeft,
  UserPlus,
  Trash2,
  Send,
  FileSpreadsheet,
  BarChart3,
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
  AdminIconButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   👥 Rowi Admin — Community Members (Specific Community)
   ---------------------------------------------------------
   Manage members of a specific community
========================================================= */

interface MemberData {
  id: string;
  userId?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    lastLogin?: string;
    seiRequested?: boolean;
    seiCompletedAt?: string;
  };
}

interface CommunityData {
  id: string;
  name: string;
  slug: string;
  _count?: { members: number };
}

export default function CommunityMembersPage() {
  const { communityId } = useParams();
  const router = useRouter();
  const { t, ready } = useI18n();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [comRes, memRes] = await Promise.all([
        fetch(`/api/hub/communities/${communityId}`),
        fetch(`/api/hub/communities/${communityId}/members`),
      ]);

      if (comRes.ok) {
        const comData = await comRes.json();
        setCommunity(comData);
      }

      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(Array.isArray(memData) ? memData : []);
      }
    } catch {
      toast.error(t("common.error") || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && communityId) loadData();
  }, [ready, communityId]);

  async function sendInviteEmail(memberId: string, email: string) {
    setSendingInvite(memberId);
    try {
      const res = await fetch("/api/community/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, email, communityId }),
      });

      if (!res.ok) throw new Error();
      toast.success(t("admin.members.inviteSent") || `Invitación enviada a ${email}`);
    } catch {
      toast.error(t("common.error") || "Error al enviar invitación");
    } finally {
      setSendingInvite(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm(t("admin.members.confirmRemove") || "¿Estás seguro de eliminar este miembro?")) return;
    try {
      const res = await fetch(`/api/hub/communities/${communityId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.members.removed") || "Miembro eliminado");
      loadData();
    } catch {
      toast.error(t("common.error") || "Error al eliminar miembro");
    }
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.user?.name || "").toLowerCase().includes(q) ||
      (m.user?.email || "").toLowerCase().includes(q)
    );
  });

  function getStatusColor(status?: string) {
    switch (status?.toLowerCase()) {
      case "active": return "success";
      case "pending": return "warning";
      case "inactive": return "default";
      default: return "default";
    }
  }

  function getRoleColor(role?: string) {
    switch (role?.toLowerCase()) {
      case "admin": return "danger";
      case "moderator": return "warning";
      case "member": return "info";
      default: return "default";
    }
  }

  const linkedCount = members.filter((m) => m.user?.id).length;
  const pendingCount = members.filter((m) => !m.user?.id || m.status === "pending").length;
  const withSeiCount = members.filter((m) => m.user?.seiCompletedAt).length;

  return (
    <AdminPage
      titleKey="admin.members.communityMembers"
      descriptionKey="admin.members.communityMembersDesc"
      icon={Users}
      loading={loading}
      breadcrumb={
        <div className="flex items-center gap-2 text-sm text-[var(--rowi-muted)] mb-4">
          <Link href="/hub/admin/communities" className="hover:text-[var(--rowi-primary)]">
            {t("admin.communities.title") || "Comunidades"}
          </Link>
          <span>/</span>
          <span className="text-[var(--rowi-foreground)] font-medium">
            {community?.name || "..."}
          </span>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-48" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <Link href={`/hub/admin/communities/import?communityId=${communityId}`}>
            <AdminButton variant="secondary" icon={FileSpreadsheet} size="sm">
              {t("admin.communities.import") || "Importar CSV"}
            </AdminButton>
          </Link>
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
            {t("admin.common.refresh") || "Actualizar"}
          </AdminButton>
          <Link href="/hub/admin/communities">
            <AdminButton variant="secondary" icon={ArrowLeft} size="sm">
              {t("admin.common.back") || "Volver"}
            </AdminButton>
          </Link>
        </div>
      }
    >
      {/* Stats Summary */}
      <AdminGrid cols={4} className="mb-6">
        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.members.total") || "Total Miembros"}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {members.length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.members.linked") || "Vinculados"}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {linkedCount}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.members.pending") || "Pendientes"}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {pendingCount}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.members.withSei") || "Con SEI"}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {withSeiCount}
              </p>
            </div>
          </div>
        </AdminCard>
      </AdminGrid>

      {/* Members List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Users}
          titleKey="admin.members.noMembers"
          descriptionKey="admin.members.noMembersDesc"
        />
      ) : viewMode === "list" ? (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.user") || "Usuario"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.email") || "Email"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.role") || "Rol"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.status") || "Estado"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    SEI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.joinedAt") || "Se unió"}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.common.actions") || "Acciones"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--rowi-border)] hover:bg-[var(--rowi-primary)]/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.user?.image ? (
                          <img
                            src={m.user.image}
                            alt={m.user.name || ""}
                            className="w-8 h-8 rounded-full object-cover border border-[var(--rowi-border)]"
                          />
                        ) : (
                          <UserCircle2 className="w-8 h-8 text-[var(--rowi-muted)]" />
                        )}
                        <span className="font-medium text-[var(--rowi-foreground)]">
                          {m.user?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--rowi-muted)] text-xs">
                      {m.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={getRoleColor(m.role)}>
                        {m.role || "member"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={getStatusColor(m.status)}>
                        {m.status || "—"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      {m.user?.seiCompletedAt ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("admin.members.completed") || "Completado"}
                        </span>
                      ) : m.user?.seiRequested ? (
                        <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {t("admin.members.pending") || "Pendiente"}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--rowi-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">
                      {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.user?.email && !m.user?.lastLogin && (
                          <AdminIconButton
                            icon={Send}
                            title={t("admin.members.sendInvite") || "Enviar Invitación"}
                            onClick={() => sendInviteEmail(m.id, m.user!.email!)}
                            loading={sendingInvite === m.id}
                          />
                        )}
                        <Link href={`/hub/admin/communities/members/${m.id}`}>
                          <AdminIconButton icon={Eye} title={t("admin.common.view") || "Ver"} />
                        </Link>
                        <AdminIconButton
                          icon={Trash2}
                          variant="danger"
                          title={t("admin.common.delete") || "Eliminar"}
                          onClick={() => removeMember(m.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((m) => (
            <AdminCard key={m.id} compact className="group">
              <div className="flex items-start gap-3 mb-3">
                {m.user?.image ? (
                  <img
                    src={m.user.image}
                    alt={m.user.name || ""}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--rowi-border)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                    {m.user?.name || "—"}
                  </h3>
                  <p className="text-[10px] text-[var(--rowi-muted)] truncate">
                    {m.user?.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <AdminBadge variant={getRoleColor(m.role)}>
                  {m.role || "member"}
                </AdminBadge>
                <AdminBadge variant={getStatusColor(m.status)}>
                  {m.status || "—"}
                </AdminBadge>
              </div>

              {/* SEI Status */}
              <div className="text-xs mb-3">
                {m.user?.seiCompletedAt ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    SEI {t("admin.members.completed") || "Completado"}
                  </span>
                ) : m.user?.seiRequested ? (
                  <span className="flex items-center gap-1 text-yellow-600 font-medium">
                    <Clock className="w-3 h-3" />
                    SEI {t("admin.members.pending") || "Pendiente"}
                  </span>
                ) : (
                  <span className="text-[var(--rowi-muted)]">
                    SEI: {t("admin.members.notStarted") || "No iniciado"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--rowi-border)]">
                <span className="text-[10px] text-[var(--rowi-muted)]">
                  {m.joinedAt && new Date(m.joinedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.user?.email && !m.user?.lastLogin && (
                    <AdminIconButton
                      icon={Send}
                      title={t("admin.members.sendInvite") || "Enviar Invitación"}
                      onClick={() => sendInviteEmail(m.id, m.user!.email!)}
                      loading={sendingInvite === m.id}
                    />
                  )}
                  <Link href={`/hub/admin/communities/members/${m.id}`}>
                    <AdminIconButton icon={Eye} />
                  </Link>
                  <AdminIconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={() => removeMember(m.id)}
                  />
                </div>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
