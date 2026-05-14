"use client";

import Link from "next/link";
import { Briefcase, FileText, Target, CalendarCheck, AlertTriangle, KeyRound } from "lucide-react";
import { AdminPage, AdminBadge } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type CoachNoteRow = {
  id: string;
  title: string | null;
  content: string;
  category: string | null;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  community?: { id: string; name: string } | null;
  author?: { id: string; name: string | null; email: string | null } | null;
};

const columns: Column<CoachNoteRow>[] = [
  {
    key: "createdAt",
    labelKey: "admin.coaching.col.date",
    fallback: "Date",
    render: (r) => new Date(r.createdAt).toLocaleDateString(),
  },
  {
    key: "community",
    labelKey: "admin.coaching.col.community",
    fallback: "Community",
    render: (r) => r.community?.name || "—",
  },
  {
    key: "author",
    labelKey: "admin.coaching.col.coach",
    fallback: "Coach",
    render: (r) => r.author?.name || "—",
  },
  { key: "title", labelKey: "admin.coaching.col.title", fallback: "Title" },
  {
    key: "category",
    labelKey: "admin.coaching.col.category",
    fallback: "Category",
    render: (r) =>
      r.category ? (
        <AdminBadge variant="info">{r.category}</AdminBadge>
      ) : (
        "—"
      ),
  },
  {
    key: "content",
    labelKey: "admin.coaching.col.preview",
    fallback: "Preview",
    render: (r) => (
      <div className="text-xs leading-relaxed max-w-md max-h-12 overflow-hidden">
        {r.content.length > 200 ? r.content.slice(0, 200) + "…" : r.content}
      </div>
    ),
    className: "max-w-md",
  },
  {
    key: "isPrivate",
    labelKey: "admin.coaching.col.private",
    fallback: "Private",
    render: (r) => (r.isPrivate ? "🔒" : "—"),
  },
];

const subSections = [
  { href: "/hub/admin/coaching", label: "Notes", icon: FileText },
  { href: "/hub/admin/coaching/plans", label: "Plans", icon: Target },
  { href: "/hub/admin/coaching/campaigns", label: "Campaigns", icon: CalendarCheck },
  { href: "/hub/admin/coaching/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/hub/admin/coaching/clients", label: "Client access", icon: KeyRound },
];

export default function CoachingAdminPage() {
  return (
    <AdminPage
      titleKey="admin.coaching.notes.title"
      descriptionKey="admin.coaching.notes.description"
      icon={Briefcase}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {subSections.map((s) => {
            const Icon = s.icon;
            const active = s.href === "/hub/admin/coaching";
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-[var(--rowi-primary)] text-white"
                    : "bg-[var(--rowi-border)]/30 text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </Link>
            );
          })}
        </div>

        <EntityTable<CoachNoteRow>
          endpoint="/api/admin/coaching/notes"
          columns={columns}
          searchPlaceholderKey="admin.coaching.notes.search"
        />
      </div>
    </AdminPage>
  );
}
