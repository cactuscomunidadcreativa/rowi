"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";
import { useI18n } from "@/lib/i18n/useI18n";

type Tab = "eco" | "coach" | "ai" | "debrief";

type EcoRow = { id: string; owner: string; other: string; relationType: string; messageCount: number; lastGoal: string; ecoLevel: string; updatedAt: string };
type CoachRow = { id: string; author: string; category: string; title: string; content: string; tags: string; createdAt: string };
type AiRow = { id: string; kind: string; model: string; scope: string; response: string; hits: number; createdAt: string };
type DebriefRow = { id: string; scope: string; status: string; step: number; facilitator: string; subject: string; notes: string; scheduledAt: string };

const ecoCols: Column<EcoRow>[] = [
  { key: "owner", labelKey: "admin.conversations.col.owner", fallback: "Dueño" },
  { key: "other", labelKey: "admin.conversations.col.other", fallback: "Con" },
  { key: "relationType", labelKey: "admin.conversations.col.relation", fallback: "Relación" },
  { key: "ecoLevel", labelKey: "admin.conversations.col.level", fallback: "Nivel" },
  { key: "messageCount", labelKey: "admin.conversations.col.messages", fallback: "Mensajes" },
  { key: "lastGoal", labelKey: "admin.conversations.col.lastGoal", fallback: "Último objetivo", className: "max-w-xs truncate" },
  { key: "updatedAt", labelKey: "admin.conversations.col.updated", fallback: "Actualizado" },
];
const coachCols: Column<CoachRow>[] = [
  { key: "author", labelKey: "admin.conversations.col.author", fallback: "Autor" },
  { key: "category", labelKey: "admin.conversations.col.category", fallback: "Categoría" },
  { key: "title", labelKey: "admin.conversations.col.title", fallback: "Título" },
  { key: "content", labelKey: "admin.conversations.col.content", fallback: "Contenido", className: "max-w-md" },
  { key: "tags", labelKey: "admin.conversations.col.tags", fallback: "Tags" },
  { key: "createdAt", labelKey: "admin.conversations.col.created", fallback: "Creado" },
];
const aiCols: Column<AiRow>[] = [
  { key: "kind", labelKey: "admin.conversations.col.kind", fallback: "Tipo" },
  { key: "model", labelKey: "admin.conversations.col.model", fallback: "Modelo" },
  { key: "scope", labelKey: "admin.conversations.col.scope", fallback: "Scope" },
  { key: "response", labelKey: "admin.conversations.col.response", fallback: "Respuesta", className: "max-w-md" },
  { key: "hits", labelKey: "admin.conversations.col.hits", fallback: "Hits" },
  { key: "createdAt", labelKey: "admin.conversations.col.created", fallback: "Creado" },
];
const debriefCols: Column<DebriefRow>[] = [
  { key: "scope", labelKey: "admin.conversations.col.scope", fallback: "Scope" },
  { key: "status", labelKey: "admin.conversations.col.status", fallback: "Estado" },
  { key: "facilitator", labelKey: "admin.conversations.col.facilitator", fallback: "Facilitador" },
  { key: "subject", labelKey: "admin.conversations.col.subject", fallback: "Sujeto" },
  { key: "notes", labelKey: "admin.conversations.col.notes", fallback: "Notas", className: "max-w-md" },
  { key: "scheduledAt", labelKey: "admin.conversations.col.scheduled", fallback: "Agendado" },
];

export default function ConversationsAdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("eco");

  const tabs: { key: Tab; labelKey: string; fallback: string }[] = [
    { key: "eco", labelKey: "admin.conversations.tab.eco", fallback: "ECO (díadas)" },
    { key: "coach", labelKey: "admin.conversations.tab.coach", fallback: "Notas de coaching" },
    { key: "ai", labelKey: "admin.conversations.tab.ai", fallback: "Respuestas IA" },
    { key: "debrief", labelKey: "admin.conversations.tab.debrief", fallback: "Debrief" },
  ];

  return (
    <AdminPage
      titleKey="admin.conversations.title"
      descriptionKey="admin.conversations.description"
      icon={MessagesSquare}
    >
      <p className="text-xs text-[var(--rowi-muted)] border-l-2 border-[var(--rowi-primary)] pl-3">
        {t("admin.conversations.privacy", "Material sensible. El texto ECO es privado y nunca se contribuye al dataset anónimo. Cada acceso queda auditado.")}
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`text-sm rounded-lg px-4 py-2 ${tab === tb.key ? "bg-[var(--rowi-primary)] text-white" : "border border-[var(--rowi-border)] text-[var(--rowi-foreground)]"}`}
          >
            {t(tb.labelKey, tb.fallback)}
          </button>
        ))}
      </div>

      {tab === "eco" && (
        <EntityTable<EcoRow> endpoint="/api/admin/conversations/eco" columns={ecoCols}
          searchPlaceholderKey="admin.conversations.search.eco" emptyKey="admin.conversations.empty" />
      )}
      {tab === "coach" && (
        <EntityTable<CoachRow> endpoint="/api/admin/conversations/coach" columns={coachCols}
          searchPlaceholderKey="admin.conversations.search.coach" emptyKey="admin.conversations.empty" />
      )}
      {tab === "ai" && (
        <EntityTable<AiRow> endpoint="/api/admin/conversations/ai" columns={aiCols}
          searchPlaceholderKey="admin.conversations.search.ai" emptyKey="admin.conversations.empty" />
      )}
      {tab === "debrief" && (
        <EntityTable<DebriefRow> endpoint="/api/admin/conversations/debrief" columns={debriefCols}
          searchPlaceholderKey="admin.conversations.search.debrief" emptyKey="admin.conversations.empty" />
      )}
    </AdminPage>
  );
}
