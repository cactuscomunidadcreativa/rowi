"use client";

import Link from "next/link";
import { KeyRound, Activity } from "lucide-react";
import { AdminPage, AdminBadge } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type ClientAccessRow = {
  id: string;
  clientEmail: string;
  clientName: string | null;
  permissions: Record<string, boolean>;
  expiresAt: string | null;
  lastAccessAt: string | null;
  accessCount: number;
  revokedAt: string | null;
  createdAt: string;
  community?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
};

const columns: Column<ClientAccessRow>[] = [
  {
    key: "client",
    labelKey: "admin.coaching.col.client",
    fallback: "Client",
    render: (r) => (
      <div>
        <div className="font-medium">{r.clientName || "—"}</div>
        <div className="text-xs text-[var(--rowi-muted)]">{r.clientEmail}</div>
      </div>
    ),
  },
  {
    key: "community",
    labelKey: "admin.coaching.col.community",
    fallback: "Community",
    render: (r) => r.community?.name || "—",
  },
  {
    key: "status",
    labelKey: "admin.coaching.col.status",
    fallback: "Status",
    render: (r) =>
      r.revokedAt ? (
        <AdminBadge variant="error">Revoked</AdminBadge>
      ) : r.expiresAt && new Date(r.expiresAt) < new Date() ? (
        <AdminBadge variant="warning">Expired</AdminBadge>
      ) : (
        <AdminBadge variant="success">Active</AdminBadge>
      ),
  },
  {
    key: "lastAccessAt",
    labelKey: "admin.coaching.col.lastAccess",
    fallback: "Last access",
    render: (r) =>
      r.lastAccessAt ? new Date(r.lastAccessAt).toLocaleDateString() : "—",
  },
  {
    key: "accessCount",
    labelKey: "admin.coaching.col.accessCount",
    fallback: "Access count",
  },
  {
    key: "expiresAt",
    labelKey: "admin.coaching.col.expires",
    fallback: "Expires",
    render: (r) => (r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"),
  },
  {
    key: "createdBy",
    labelKey: "admin.coaching.col.grantedBy",
    fallback: "Granted by",
    render: (r) => r.createdBy?.name || "—",
  },
  {
    key: "vitalSigns",
    labelKey: "admin.coaching.col.vitalSigns",
    fallback: "Vital Signs",
    render: (r) => (
      <Link
        href={`/hub/admin/coaching/clients/${r.id}/vital-signs`}
        className="inline-flex items-center gap-1 text-xs text-[var(--rowi-g2)] hover:underline"
      >
        <Activity className="w-3 h-3" />
        VS
      </Link>
    ),
  },
];

export default function CoachingClientsAdminPage() {
  return (
    <AdminPage
      titleKey="admin.coaching.clients.title"
      descriptionKey="admin.coaching.clients.description"
      icon={KeyRound}
    >
      <EntityTable<ClientAccessRow>
        endpoint="/api/admin/coaching/clients"
        columns={columns}
        searchPlaceholderKey="admin.coaching.clients.search"
      />
    </AdminPage>
  );
}
