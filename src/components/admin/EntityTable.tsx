"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/useI18n";

export type Column<T> = {
  key: string;
  labelKey: string;
  fallback: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

interface EntityTableProps<T extends { id: string }> {
  endpoint: string;
  columns: Column<T>[];
  searchPlaceholderKey?: string;
  pageSize?: number;
  emptyKey?: string;
}

export function EntityTable<T extends { id: string }>({
  endpoint,
  columns,
  searchPlaceholderKey,
  pageSize = 25,
  emptyKey,
}: EntityTableProps<T>) {
  const { t } = useI18n();
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`${endpoint}?${params.toString()}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error");
      setRows(json.rows || []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error(t("common.error", "Error"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              searchPlaceholderKey || "common.search",
              "Search...",
            )}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-sm text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
          />
        </div>
        <button
          onClick={() => load()}
          className="p-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
          title={t("admin.common.refresh", "Refresh")}
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-xl border border-[var(--rowi-border)] bg-[var(--rowi-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-[var(--rowi-primary)] animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--rowi-muted)]">
            {t(emptyKey || "common.empty", "No records found")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--rowi-border)]/30 text-xs uppercase tracking-wide text-[var(--rowi-muted)]">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`text-left px-3 py-2 font-medium ${c.className || ""}`}
                    >
                      {t(c.labelKey, c.fallback)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rowi-border)]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--rowi-border)]/20">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2 align-top text-[var(--rowi-foreground)] ${c.className || ""}`}
                      >
                        {c.render
                          ? c.render(row)
                          : ((row as Record<string, unknown>)[c.key] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--rowi-muted)]">
        <span>
          {total.toLocaleString()}{" "}
          {t("admin.common.totalRecords", "total records")}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-md border border-[var(--rowi-border)] disabled:opacity-40 hover:bg-[var(--rowi-border)]/30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-md border border-[var(--rowi-border)] disabled:opacity-40 hover:bg-[var(--rowi-border)]/30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
