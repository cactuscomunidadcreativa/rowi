"use client";

import { useEffect, useState } from "react";
import { Users2, Loader2, CheckSquare, Square, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Orphan = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  tenantId: string | null;
  joinedAt: string;
  tenant: { id: string; name: string } | null;
};

type Community = {
  id: string;
  name: string;
  slug: string;
  tenantId: string | null;
  workspaceType: string | null;
};

export default function OrphanMembersAdminPage() {
  const { t } = useI18n();
  const [orphans, setOrphans] = useState<Orphan[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetCommunity, setTargetCommunity] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/community-members/orphans", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Error");
      setOrphans(json.rows || []);
      setCommunities(json.candidateCommunities || []);
    } catch (e: any) {
      toast.error(
        e?.message ||
          t("admin.orphans.loadError", "Error cargando miembros huérfanos"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === orphans.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orphans.map((o) => o.id)));
    }
  }

  // Filter the communities the user can pick to those in the same tenant
  // as ALL selected orphans (so the server won't reject any of them as
  // cross-tenant).
  const sharedTenantId = (() => {
    const tenantIds = new Set(
      Array.from(selected)
        .map((id) => orphans.find((o) => o.id === id)?.tenantId || null)
        .filter(Boolean) as string[],
    );
    if (tenantIds.size === 1) return Array.from(tenantIds)[0];
    return null;
  })();

  const eligibleCommunities = sharedTenantId
    ? communities.filter((c) => c.tenantId === sharedTenantId)
    : communities;

  async function assign() {
    if (selected.size === 0 || !targetCommunity) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/community-members/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: Array.from(selected),
          communityId: targetCommunity,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Error");
      toast.success(
        t("admin.orphans.assigned", "Asignados:") +
          ` ${json.assigned}${
            json.skipped ? ` · ${t("admin.orphans.skipped", "omitidos")}: ${json.skipped}` : ""
          }`,
      );
      setSelected(new Set());
      setTargetCommunity("");
      load();
    } catch (e: any) {
      toast.error(e?.message || t("admin.orphans.assignError", "Error al asignar"));
    } finally {
      setAssigning(false);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {t("admin.orphans.title", "Miembros huérfanos")}
            </h1>
            <p className="text-sm rowi-muted">
              {t(
                "admin.orphans.subtitle",
                "Personas importadas a un tenant pero sin community asignada.",
              )}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t("admin.audit.refresh", "Actualizar")}
        </button>
      </header>

      {selected.size > 0 && (
        <div className="rowi-card border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              <span className="font-medium">
                {selected.size}{" "}
                {t("admin.orphans.selected", "seleccionados")}
              </span>
              {sharedTenantId === null && selected.size > 1 && (
                <span className="ml-2 text-amber-600 text-xs">
                  {t(
                    "admin.orphans.crossTenant",
                    "⚠ La selección abarca varios tenants — solo se asignarán los del tenant elegido.",
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={targetCommunity}
                onChange={(e) => setTargetCommunity(e.target.value)}
                className="rounded-md border px-3 py-2 bg-transparent text-sm min-w-[200px]"
              >
                <option value="">
                  {t("admin.orphans.pickCommunity", "Elige community destino")}
                </option>
                {eligibleCommunities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.workspaceType ? ` (${c.workspaceType})` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={assign}
                disabled={!targetCommunity || assigning}
                className="rowi-btn-primary text-sm disabled:opacity-50"
              >
                {assigning
                  ? t("admin.orphans.assigning", "Asignando...")
                  : t("admin.orphans.assign", "Asignar")}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm rowi-muted hover:underline"
              >
                {t("admin.orphans.clearSelection", "Limpiar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rowi-card flex items-center gap-2 rowi-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading", "Cargando...")}
        </div>
      ) : orphans.length === 0 ? (
        <div className="rowi-card text-center py-12">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-lg font-medium mb-1">
            {t("admin.orphans.empty.title", "No hay miembros huérfanos")}
          </h2>
          <p className="text-sm rowi-muted">
            {t(
              "admin.orphans.empty.body",
              "Todas las personas importadas están asignadas a una community.",
            )}
          </p>
        </div>
      ) : (
        <div className="rowi-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-2 py-2 w-8">
                  <button onClick={toggleAll} title="Toggle all">
                    {selected.size === orphans.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-2">
                  {t("admin.orphans.col.name", "Nombre")}
                </th>
                <th className="px-2 py-2">
                  {t("admin.orphans.col.email", "Email")}
                </th>
                <th className="px-2 py-2">
                  {t("admin.orphans.col.tenant", "Tenant")}
                </th>
                <th className="px-2 py-2">
                  {t("admin.orphans.col.role", "Rol")}
                </th>
                <th className="px-2 py-2">
                  {t("admin.orphans.col.joinedAt", "Importado")}
                </th>
              </tr>
            </thead>
            <tbody>
              {orphans.map((o) => {
                const checked = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    className={`border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/40 ${
                      checked ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                    }`}
                  >
                    <td className="px-2 py-2">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                    <td className="px-2 py-2 font-medium">{o.name || "—"}</td>
                    <td className="px-2 py-2 rowi-muted">{o.email || "—"}</td>
                    <td className="px-2 py-2">{o.tenant?.name || "—"}</td>
                    <td className="px-2 py-2 rowi-muted text-xs">
                      {o.role || "—"}
                    </td>
                    <td className="px-2 py-2 text-xs rowi-muted">
                      {new Date(o.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
