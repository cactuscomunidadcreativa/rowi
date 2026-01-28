"use client";

import { useState } from "react";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n/useI18n"; // ✅ reemplazado
const fx = (u: string) => fetch(u).then((r) => r.json());

export default function AnnouncementsPage() {
  const { t } = useI18n("hub"); // ✅ actualizado
  const { data, mutate } = useSWR("/api/hub/announcements", fx);

  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function post() {
    await fetch("/api/hub/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, title, content }),
    });
    setTitle("");
    setContent("");
    mutate();
  }

  async function broadcast(id: string) {
    await fetch(`/api/hub/announcements?id=${id}`, { method: "PATCH" });
    mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("announcements")}</h1>

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
            onClick={post}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            {t("create")}
          </button>
        </div>

        {/* Listado */}
        <div className="space-y-2">
          {(data || []).map((a: any) => (
            <div key={a.id} className="p-4 rounded-xl border bg-white">
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-gray-500">{a.status}</div>
              <button
                onClick={() => broadcast(a.id)}
                className="mt-2 px-3 py-1 border rounded"
              >
                {t("sendTest")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}