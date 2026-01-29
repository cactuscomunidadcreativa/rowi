"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  MessageCircle,
  Smartphone,
  Hash,
  Building2,
  UserPlus,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Copy,
  Check,
  Send,
  Link2,
  Users,
  Filter,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminEmpty,
  AdminIconButton,
  AdminSearch,
  AdminViewToggle,
  AdminList,
  AdminListItem,
} from "@/components/admin/AdminPage";

/* =========================================================
   📨 Rowi Admin — Invites Management
   ---------------------------------------------------------
   Gestión de invitaciones a comunidades
========================================================= */

interface Invite {
  id: string;
  token?: string;
  contact?: string;
  email?: string;
  phone?: string;
  name?: string;
  channel?: "email" | "whatsapp" | "sms" | "slack" | "teams";
  status: "pending" | "accepted" | "expired";
  sentAt?: string;
  createdAt?: string;
  expiresAt?: string;
  url?: string;
  community?: {
    id: string;
    name: string;
  };
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
}

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email", icon: Mail, color: "#3B82F6" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { value: "sms", label: "SMS", icon: Smartphone, color: "#8B5CF6" },
  { value: "slack", label: "Slack", icon: Hash, color: "#E01E5A" },
  { value: "teams", label: "Teams", icon: Building2, color: "#6264A7" },
];

export default function InvitesAdminPage() {
  const { t, ready, lang } = useI18n();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadInvites() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invites", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setInvites(data.invites || []);
        setStats(data.stats || null);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadInvites();
  }, [ready]);

  async function deleteInvite(id: string) {
    if (!confirm(t("admin.invites.confirmDelete"))) return;
    try {
      const res = await fetch("/api/admin/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.invites.deleted"));
      loadInvites();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  function copyInviteLink(inv: Invite) {
    const link = inv.url || `${window.location.origin}/invite/${inv.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(inv.id);
      toast.success(lang === "es" ? "Link copiado" : "Link copied");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const filtered = invites.filter((inv) => {
    const matchesSearch =
      (inv.contact || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.community?.name || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getChannelInfo = (channel?: string) => {
    return CHANNEL_OPTIONS.find((c) => c.value === channel) || CHANNEL_OPTIONS[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <AdminBadge variant="warning">
            <Clock className="w-3 h-3" />
            {lang === "es" ? "Pendiente" : "Pending"}
          </AdminBadge>
        );
      case "accepted":
        return (
          <AdminBadge variant="success">
            <CheckCircle2 className="w-3 h-3" />
            {lang === "es" ? "Aceptada" : "Accepted"}
          </AdminBadge>
        );
      case "expired":
        return (
          <AdminBadge variant="error">
            <XCircle className="w-3 h-3" />
            {lang === "es" ? "Expirada" : "Expired"}
          </AdminBadge>
        );
      default:
        return null;
    }
  };

  return (
    <AdminPage
      titleKey="admin.invites.title"
      descriptionKey="admin.invites.description"
      icon={UserPlus}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-background)] border border-[var(--rowi-border)]"
          >
            <option value="all">{lang === "es" ? "Todos" : "All"}</option>
            <option value="pending">{lang === "es" ? "Pendientes" : "Pending"}</option>
            <option value="accepted">{lang === "es" ? "Aceptadas" : "Accepted"}</option>
            <option value="expired">{lang === "es" ? "Expiradas" : "Expired"}</option>
          </select>
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadInvites}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {/* Stats */}
      {stats && (
        <AdminGrid cols={4} className="mb-6">
          <AdminCard className="text-center">
            <div className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</div>
            <div className="text-xs text-[var(--rowi-muted)]">{lang === "es" ? "Total" : "Total"}</div>
          </AdminCard>
          <AdminCard className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-xs text-[var(--rowi-muted)]">{lang === "es" ? "Pendientes" : "Pending"}</div>
          </AdminCard>
          <AdminCard className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
            <div className="text-xs text-[var(--rowi-muted)]">{lang === "es" ? "Aceptadas" : "Accepted"}</div>
          </AdminCard>
          <AdminCard className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.expired}</div>
            <div className="text-xs text-[var(--rowi-muted)]">{lang === "es" ? "Expiradas" : "Expired"}</div>
          </AdminCard>
        </AdminGrid>
      )}

      {/* Invites List */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={UserPlus}
          titleKey="admin.invites.noInvites"
          descriptionKey="admin.invites.noInvitesDesc"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((inv) => {
            const channelInfo = getChannelInfo(inv.channel);
            const ChannelIcon = channelInfo.icon;
            const contactDisplay = inv.contact || inv.email || inv.phone || "—";
            const createdDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—";

            return (
              <AdminListItem
                key={inv.id}
                icon={ChannelIcon}
                iconColor={channelInfo.color}
                title={
                  <span className="flex items-center gap-2">
                    {inv.name || contactDisplay}
                    {inv.community && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                        {inv.community.name}
                      </span>
                    )}
                  </span>
                }
                subtitle={inv.name ? contactDisplay : `${lang === "es" ? "Creada" : "Created"}: ${createdDate}`}
                badge={getStatusBadge(inv.status)}
                meta={
                  <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
                    {inv.invitedBy && (
                      <span>{lang === "es" ? "Por" : "By"}: {inv.invitedBy.name || inv.invitedBy.email}</span>
                    )}
                  </div>
                }
                actions={
                  <>
                    <AdminIconButton
                      icon={copiedId === inv.id ? Check : Link2}
                      onClick={() => copyInviteLink(inv)}
                      title={lang === "es" ? "Copiar link" : "Copy link"}
                    />
                    {inv.status === "pending" && (
                      <AdminIconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() => deleteInvite(inv.id)}
                        title={t("admin.common.delete")}
                      />
                    )}
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((inv) => {
            const channelInfo = getChannelInfo(inv.channel);
            const ChannelIcon = channelInfo.icon;
            const contactDisplay = inv.contact || inv.email || inv.phone || "—";
            const createdDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—";
            const expiresDate = inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—";

            return (
              <AdminCard key={inv.id} className="group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${channelInfo.color}20` }}
                    >
                      <ChannelIcon className="w-5 h-5" style={{ color: channelInfo.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                        {inv.name || contactDisplay}
                      </h3>
                      {inv.name && (
                        <p className="text-xs text-[var(--rowi-muted)]">{contactDisplay}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>

                {/* Community */}
                {inv.community && (
                  <div className="mb-3">
                    <span className="text-xs px-2 py-1 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                      {inv.community.name}
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-[var(--rowi-muted)] space-y-1 mb-3">
                  <p>{lang === "es" ? "Creada" : "Created"}: {createdDate}</p>
                  <p>{lang === "es" ? "Expira" : "Expires"}: {expiresDate}</p>
                </div>

                {/* Invited by */}
                {inv.invitedBy && (
                  <p className="text-xs text-[var(--rowi-muted)] mb-3">
                    {lang === "es" ? "Por" : "By"}: {inv.invitedBy.name || inv.invitedBy.email}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-1 pt-3 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminIconButton
                    icon={copiedId === inv.id ? Check : Link2}
                    onClick={() => copyInviteLink(inv)}
                  />
                  {inv.status === "pending" && (
                    <AdminIconButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => deleteInvite(inv.id)}
                    />
                  )}
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
