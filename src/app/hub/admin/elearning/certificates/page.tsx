"use client";

import { Award } from "lucide-react";
import { AdminPage, AdminBadge } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type CertificateRow = {
  id: string;
  title: string;
  description: string | null;
  emotionTag: string | null;
  issueDate: string;
  expiryDate: string | null;
  verified: boolean;
  credentialId: string | null;
  user?: { id: string; name: string | null; email: string | null } | null;
  course?: { id: string; title: string | null } | null;
};

const columns: Column<CertificateRow>[] = [
  {
    key: "user",
    labelKey: "admin.elearning.col.user",
    fallback: "Recipient",
    render: (r) => (
      <div>
        <div className="font-medium">{r.user?.name || "—"}</div>
        <div className="text-xs text-[var(--rowi-muted)]">{r.user?.email || "—"}</div>
      </div>
    ),
  },
  { key: "title", labelKey: "admin.elearning.col.title", fallback: "Title" },
  {
    key: "course",
    labelKey: "admin.elearning.col.course",
    fallback: "Course",
    render: (r) => r.course?.title || "—",
  },
  {
    key: "issueDate",
    labelKey: "admin.elearning.col.issued",
    fallback: "Issued",
    render: (r) => new Date(r.issueDate).toLocaleDateString(),
  },
  {
    key: "expiryDate",
    labelKey: "admin.elearning.col.expires",
    fallback: "Expires",
    render: (r) => (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "—"),
  },
  {
    key: "verified",
    labelKey: "admin.elearning.col.verified",
    fallback: "Verified",
    render: (r) =>
      r.verified ? (
        <AdminBadge variant="success">✓</AdminBadge>
      ) : (
        <AdminBadge variant="neutral">—</AdminBadge>
      ),
  },
  { key: "credentialId", labelKey: "admin.elearning.col.credential", fallback: "Credential" },
];

export default function ElearningCertificatesAdminPage() {
  return (
    <AdminPage
      titleKey="admin.elearning.certificates.title"
      descriptionKey="admin.elearning.certificates.description"
      icon={Award}
    >
      <EntityTable<CertificateRow>
        endpoint="/api/admin/elearning/certificates"
        columns={columns}
        searchPlaceholderKey="admin.elearning.certificates.search"
      />
    </AdminPage>
  );
}
