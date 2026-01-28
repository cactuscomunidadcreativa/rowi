"use client";

import { useState } from "react";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n/useI18n"; // ✅ reemplazado

const fx = (u: string) => fetch(u).then((r) => r.json());

export default function IntegrationsPage() {
  const { t } = useI18n("hub"); // ✅ actualizado
  const { data, mutate } = useSWR("/api/hub/integrations", fx);

  const [tenantId, setTenantId] = useState("");
  const [kind, setKind] = useState("slack");
  const [config, setConfig] = useState(
    '{"webhookUrl":"https://hooks.slack.com/..."}'
  );

  async function save() {
    await fetch("/api/hub/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        kind,
        config: JSON.parse(config),
      }),
    });
    mutate();
  }

  async function test(id: string) {
    await fetch(`/api/hub/integrations?id=${id}`, { method: "PATCH" });
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{t("integrations")}</h1>

      {/* Formulario */}
      <div className="p-4 rounded-xl border bg-white space-y-2">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="tenantId"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />

        <select
          className="border rounded px-2 py-1 w-full"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="slack">Slack</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="teams">Teams</option>
          <option value="zoom">Zoom</option>
        </select>

        <textarea
          className="border rounded px-2 py-1 w-full"
          rows={5}
          value={config}
          onChange={(e) => setConfig(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-indigo-600 text-white rounded"
            onClick={save}
          >
            {t("save")}
          </button>
        </div>
      </div>

      {/* Vista previa */}
      <pre className="p-4 bg-white rounded-lg border overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}