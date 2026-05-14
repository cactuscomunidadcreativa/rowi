"use client";

import { Target } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  passingScore: number | null;
  lesson?: { id: string; title: string | null } | null;
  _count?: { attempts: number };
};

const columns: Column<QuizRow>[] = [
  { key: "title", labelKey: "admin.elearning.col.title", fallback: "Title" },
  {
    key: "lesson",
    labelKey: "admin.elearning.col.lesson",
    fallback: "Lesson",
    render: (r) => r.lesson?.title || "—",
  },
  {
    key: "passingScore",
    labelKey: "admin.elearning.col.passingScore",
    fallback: "Passing",
    render: (r) => (r.passingScore != null ? `${r.passingScore}%` : "—"),
  },
  {
    key: "attempts",
    labelKey: "admin.elearning.col.attempts",
    fallback: "Attempts",
    render: (r) => r._count?.attempts ?? 0,
  },
  { key: "description", labelKey: "admin.elearning.col.description", fallback: "Description" },
];

export default function ElearningQuizzesAdminPage() {
  return (
    <AdminPage
      titleKey="admin.elearning.quizzes.title"
      descriptionKey="admin.elearning.quizzes.description"
      icon={Target}
    >
      <EntityTable<QuizRow>
        endpoint="/api/admin/elearning/quizzes"
        columns={columns}
        searchPlaceholderKey="admin.elearning.quizzes.search"
      />
    </AdminPage>
  );
}
