"use client";

import { useEffect, useState } from "react";
import { Network, Loader2, Building2, RefreshCw, ChevronRight, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type EmployeeNode = {
  id: string;
  position: string | null;
  department: string | null;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  tenant: { id: string; name: string } | null;
  managerId: string | null;
  children: EmployeeNode[];
};

type ChartResponse = {
  ok: boolean;
  roots: EmployeeNode[];
  orphans: EmployeeNode[];
  total: number;
};

function NodeRow({
  node,
  depth = 0,
  expanded,
  toggle,
}: {
  node: EmployeeNode;
  depth?: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const name = node.user?.name || node.user?.email || "—";
  const role = [node.position, node.department].filter(Boolean).join(" · ");

  return (
    <>
      <div
        className="flex items-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/40 rounded"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button
          onClick={() => toggle(node.id)}
          className={`w-5 h-5 flex items-center justify-center ${
            hasChildren ? "text-gray-500 hover:text-gray-900" : "invisible"
          }`}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </button>
        {node.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.user.image}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {(name[0] || "?").toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          {role && (
            <div className="text-xs rowi-muted truncate">{role}</div>
          )}
        </div>
        {hasChildren && (
          <span className="text-xs rowi-muted">
            {node.children.length}{" "}
            {node.children.length === 1 ? "reporte" : "reportes"}
          </span>
        )}
        {node.status !== "ACTIVE" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
            {node.status}
          </span>
        )}
      </div>
      {isOpen &&
        node.children.map((child) => (
          <NodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
          />
        ))}
    </>
  );
}

export default function OrgChartAdminPage() {
  const { t } = useI18n();
  const [data, setData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hr/org-chart", {
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
      // Default: expand top 2 levels for visibility.
      const expandIds = new Set<string>();
      const walk = (node: EmployeeNode, depth: number) => {
        if (depth < 2 && node.children.length > 0) expandIds.add(node.id);
        node.children.forEach((c) => walk(c, depth + 1));
      };
      (json.roots || []).forEach((r: EmployeeNode) => walk(r, 0));
      setExpanded(expandIds);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Group roots by tenant for clearer rendering when multi-tenant.
  const rootsByTenant = new Map<string, EmployeeNode[]>();
  for (const r of data?.roots || []) {
    const key = r.tenant?.id || "_no_tenant";
    const list = rootsByTenant.get(key) || [];
    list.push(r);
    rootsByTenant.set(key, list);
  }

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {t("admin.orgChart.title", "Organigrama")}
            </h1>
            <p className="text-sm rowi-muted">
              {t(
                "admin.orgChart.subtitle",
                "Jerarquía manager → reportes directos en tus tenants accesibles.",
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

      {loading ? (
        <div className="rowi-card flex items-center gap-2 rowi-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading", "Cargando...")}
        </div>
      ) : !data ? (
        <div className="rowi-card text-red-600">
          {t("admin.orgChart.error", "Error cargando organigrama")}
        </div>
      ) : data.total === 0 ? (
        <div className="rowi-card text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-sm rowi-muted">
            {t("admin.orgChart.empty", "No hay empleados en tus tenants accesibles.")}
          </p>
        </div>
      ) : (
        <>
          {Array.from(rootsByTenant.entries()).map(([tenantId, roots]) => (
            <section key={tenantId} className="rowi-card">
              <header className="flex items-center gap-2 pb-3 mb-2 border-b">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <h2 className="font-medium">
                  {roots[0]?.tenant?.name ||
                    t("admin.orgChart.noTenant", "Sin tenant")}
                </h2>
                <span className="text-xs rowi-muted">
                  {roots.length}{" "}
                  {roots.length === 1
                    ? t("admin.orgChart.rootSingular", "raíz")
                    : t("admin.orgChart.rootPlural", "raíces")}
                </span>
              </header>
              <div className="space-y-0.5">
                {roots.map((r) => (
                  <NodeRow
                    key={r.id}
                    node={r}
                    expanded={expanded}
                    toggle={toggle}
                  />
                ))}
              </div>
            </section>
          ))}

          {data.orphans.length > 0 && (
            <section className="rowi-card border-l-4 border-amber-500">
              <header className="flex items-center gap-2 pb-3 mb-2 border-b">
                <h2 className="font-medium">
                  {t(
                    "admin.orgChart.orphansTitle",
                    "Empleados con manager fuera de tu scope",
                  )}
                </h2>
                <span className="text-xs rowi-muted">
                  ({data.orphans.length})
                </span>
              </header>
              <div className="space-y-0.5">
                {data.orphans.map((o) => (
                  <NodeRow
                    key={o.id}
                    node={o}
                    expanded={expanded}
                    toggle={toggle}
                  />
                ))}
              </div>
            </section>
          )}

          <p className="text-xs rowi-muted text-center">
            {t("admin.orgChart.total", "Total")}: {data.total}
          </p>
        </>
      )}
    </main>
  );
}
