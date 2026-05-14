"use client";

import { Heart } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type EcoEventRow = {
  id: string;
  type: string;
  message: string | null;
  contextType: string | null;
  intensity: number | null;
  valence: number | null;
  aiModel: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null } | null;
  member?: { id: string; fullName: string | null } | null;
  rowiverseUser?: { id: string; name: string | null; email: string | null } | null;
};

const columns: Column<EcoEventRow>[] = [
  {
    key: "createdAt",
    labelKey: "admin.eco.col.timestamp",
    fallback: "Time",
    render: (r) => new Date(r.createdAt).toLocaleString(),
  },
  {
    key: "user",
    labelKey: "admin.eco.col.user",
    fallback: "User",
    render: (r) => {
      const name =
        r.user?.name || r.rowiverseUser?.name || r.member?.fullName;
      const email = r.user?.email || r.rowiverseUser?.email;
      return (
        <div>
          <div className="font-medium">{name || "—"}</div>
          {email && <div className="text-xs text-[var(--rowi-muted)]">{email}</div>}
        </div>
      );
    },
  },
  {
    key: "type",
    labelKey: "admin.eco.col.type",
    fallback: "Type",
    render: (r) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600">
        {r.type}
      </span>
    ),
  },
  {
    key: "message",
    labelKey: "admin.eco.col.message",
    fallback: "Message",
    render: (r) => (
      <div className="text-xs leading-relaxed max-w-md max-h-12 overflow-hidden">
        {r.message
          ? r.message.length > 200
            ? r.message.slice(0, 200) + "…"
            : r.message
          : "—"}
      </div>
    ),
    className: "max-w-md",
  },
  {
    key: "intensity",
    labelKey: "admin.eco.col.intensity",
    fallback: "Intensity",
    render: (r) => r.intensity ?? "—",
  },
  {
    key: "valence",
    labelKey: "admin.eco.col.valence",
    fallback: "Valence",
    render: (r) => (r.valence != null ? r.valence.toFixed(2) : "—"),
  },
  { key: "aiModel", labelKey: "admin.eco.col.model", fallback: "Model" },
  { key: "contextType", labelKey: "admin.eco.col.context", fallback: "Context" },
];

export default function EcoAdminPage() {
  return (
    <AdminPage
      titleKey="admin.eco.title"
      descriptionKey="admin.eco.description"
      icon={Heart}
    >
      <EntityTable<EcoEventRow>
        endpoint="/api/admin/eco/events"
        columns={columns}
        searchPlaceholderKey="admin.eco.search"
      />
    </AdminPage>
  );
}
