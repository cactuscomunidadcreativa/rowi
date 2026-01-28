"use client";

import { useState } from "react";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n/useI18n"; // ✅ reemplazado

const fx = (u: string) => fetch(u).then((r) => r.json());

export default function BuilderPage() {
  const { t } = useI18n("hub"); // ✅ actualizado
  const { data, mutate } = useSWR("/api/hub/builder/pages", fx);

  const [tenantId, setTenantId] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function create() {
    await fetch("/api/hub/builder/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        slug,
        title,
        blocks: { content },
        published: true,
      }),
    });
    setSlug("");
    setTitle("");
    setContent("");
    mutate();
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{t("builder")}</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {/* Formulario */}
        <div className="p-4 rounded-xl border bg-white space-y-2">
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="tenantId"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder={t("slug")}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder={t("titlePage")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="border rounded px-2 py-1 w-full"
            rows={6}
            placeholder={t("content")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={create}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            {t("publish")}
          </button>
        </div>

        {/* Vista previa */}
        <pre className="p-4 bg-white rounded-lg border overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}