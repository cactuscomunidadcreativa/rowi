"use client";

import { useEffect, useState } from "react";
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
  Search,
  Filter,
  ChevronDown,
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
import LinkUserModal from "./components/LinkUserModal";

/* =========================================================
   👥 Rowi Admin — Community Members Explorer
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface CommunityInfo {
  id: string;
  name: string;
  memberCount: number;
}

interface MemberData {
  id: string;
  userId?: string;
  communityId?: string;
  communityName?: string;
  role?: string;
  status?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    lastLogin?: string;
  };
}

export default function CommunityMembersExplorer() {
  const { t, ready } = useI18n();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [communities, setCommunities] = useState<CommunityInfo[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [linkingMember, setLinkingMember] = useState<string | null>(null);

  async function loadAllMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/communities");
      const rawCommunities = await res.json();
      if (!Array.isArray(rawCommunities)) {
        setMembers([]);
        setCommunities([]);
        return;
      }

      const results = await Promise.all(
        rawCommunities.map(async (c: any) => {
          try {
            const resM = await fetch(`/api/hub/communities/${c.id}/members`);
            const data = await resM.json();
            const membersList = (Array.isArray(data) ? data : []).map((m: any) => ({
              ...m,
              communityName: c.name,
              communityId: c.id,
            }));
            return { community: c, members: membersList };
          } catch {
            return { community: c, members: [] };
          }
        })
      );

      const allMembers = results.flatMap((r) => r.members);
      setMembers(allMembers);

      // Build community list with counts
      const communityList: CommunityInfo[] = results
        .filter((r) => r.members.length > 0)
        .map((r) => ({
          id: r.community.id,
          name: r.community.name,
          memberCount: r.members.length,
        }));
      setCommunities(communityList);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAllMembers();
  }, [ready]);

  async function handleSyncAll() {
    setSyncing(true);
    try {
      await fetch("/api/hub/communities/link-all", { method: "POST" });
      toast.success(t("admin.members.syncSuccess"));
      loadAllMembers();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSyncing(false);
    }
  }

  const filtered = members.filter((m) => {
    // Community filter
    if (selectedCommunity !== "all" && m.communityId !== selectedCommunity) return false;
    // Text search
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (m.user?.name || "").toLowerCase().includes(q) ||
      (m.user?.email || "").toLowerCase().includes(q) ||
      (m.communityName || "").toLowerCase().includes(q)
    );
  });

  function getStatusColor(status?: string) {
    switch (status) {
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

  return (
    <AdminPage
      titleKey="admin.members.title"
      descriptionKey="admin.members.description"
      icon={Users}
      loading={loading}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Community filter */}
          <div className="relative">
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="appearance-none pl-8 pr-8 py-1.5 text-xs font-medium rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] text-[var(--rowi-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/30 cursor-pointer"
            >
              <option value="all">
                {t("admin.members.allCommunities") || "Todas las comunidades"} ({members.length})
              </option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.memberCount})
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--rowi-muted)] pointer-events-none" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--rowi-muted)] pointer-events-none" />
          </div>
          <AdminSearch value={search} onChange={setSearch} className="w-48" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton
            variant="secondary"
            icon={Link2}
            onClick={handleSyncAll}
            loading={syncing}
            size="sm"
          >
            {t("admin.members.syncAll")}
          </AdminButton>
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadAllMembers} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
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
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.members.total")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {filtered.length}
                {selectedCommunity !== "all" && (
                  <span className="text-xs font-normal text-[var(--rowi-muted)] ml-1">/ {members.length}</span>
                )}
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
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.members.linked")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {filtered.filter((m) => m.user?.id).length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.members.unlinked")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {filtered.filter((m) => !m.user?.id).length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.members.communities")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {selectedCommunity === "all"
                  ? communities.length
                  : 1}
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
          descriptionKey="admin.members.description"
        />
      ) : viewMode === "list" ? (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.user")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.email")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.community")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.role")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    RowiVerse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.members.lastLogin")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr
                    key={`${m.id}-${m.communityId}-${idx}`}
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
                      <span className="text-xs text-[var(--rowi-foreground)]">
                        {m.communityName}
                      </span>
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
                      {m.user?.id ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("admin.members.linkedLabel")}
                        </span>
                      ) : (
                        <button
                          onClick={() => setLinkingMember(m.id)}
                          className="text-xs text-[var(--rowi-primary)] hover:underline font-medium"
                        >
                          {t("admin.members.link")}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">
                      {m.user?.lastLogin
                        ? new Date(m.user.lastLogin).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/hub/admin/communities/members/${m.id}`}>
                        <AdminIconButton icon={Eye} title={t("admin.common.view")} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((m, idx) => (
            <AdminCard key={`${m.id}-${m.communityId}-${idx}`} compact className="group">
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

              <div className="flex items-center gap-2 mb-2">
                <HeartHandshake className="w-3 h-3 text-[var(--rowi-muted)]" />
                <span className="text-xs text-[var(--rowi-foreground)] truncate">
                  {m.communityName}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <AdminBadge variant={getRoleColor(m.role)}>
                  {m.role || "member"}
                </AdminBadge>
                <AdminBadge variant={getStatusColor(m.status)}>
                  {m.status || "—"}
                </AdminBadge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--rowi-border)]">
                {m.user?.id ? (
                  <span className="flex items-center gap-1 text-green-600 text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("admin.members.linkedLabel")}
                  </span>
                ) : (
                  <button
                    onClick={() => setLinkingMember(m.id)}
                    className="text-[10px] text-[var(--rowi-primary)] hover:underline font-medium"
                  >
                    {t("admin.members.link")}
                  </button>
                )}
                <Link href={`/hub/admin/communities/members/${m.id}`}>
                  <AdminIconButton icon={Eye} />
                </Link>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}

      {/* Link User Modal */}
      {linkingMember && (
        <LinkUserModal
          memberId={linkingMember}
          open={!!linkingMember}
          onClose={() => setLinkingMember(null)}
          onLinked={() => {
            setLinkingMember(null);
            loadAllMembers();
          }}
        />
      )}
    </AdminPage>
  );
}
