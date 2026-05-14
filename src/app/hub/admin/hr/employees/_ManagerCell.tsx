"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface EmployeeRow {
  id: string;
  tenantId?: string | null;
  user?: { name: string | null; email: string | null } | null;
  position?: string | null;
  manager?: {
    id: string;
    position: string | null;
    user: { id: string; name: string | null } | null;
  } | null;
}

interface ManagerCellProps {
  row: EmployeeRow;
  /**
   * Called after a successful PATCH so the parent can refresh the table.
   * If absent, we fall back to window.location.reload().
   */
  onUpdated?: () => void;
}

type Candidate = {
  id: string;
  position: string | null;
  user: { id: string; name: string | null; email: string | null } | null;
};

export function ManagerCell({ row, onUpdated }: ManagerCellProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    function onClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [editing]);

  useEffect(() => {
    if (!editing || candidates !== null) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Same endpoint, but request a large page so we get the full
        // tenant's employees once. Filter happens client-side.
        const res = await fetch(
          `/api/admin/hr/employees?pageSize=500&page=1`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Error");
        const rows: Candidate[] = (json.rows || [])
          .filter(
            (c: any) =>
              c.id !== row.id && // can't manage yourself
              (!row.tenantId || c.tenantId === row.tenantId), // same tenant
          )
          .map((c: any) => ({
            id: c.id,
            position: c.position,
            user: c.user,
          }));
        if (!cancelled) setCandidates(rows);
      } catch (e: any) {
        if (!cancelled) {
          toast.error(
            e?.message || t("admin.hr.manager.loadError", "Error cargando"),
          );
          setEditing(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [editing, candidates, row.id, row.tenantId, t]);

  async function save(newManagerId: string | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hr/employees/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: newManagerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      toast.success(t("admin.hr.manager.saved", "Manager actualizado"));
      setEditing(false);
      if (onUpdated) onUpdated();
      else if (typeof window !== "undefined") window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || t("admin.hr.manager.saveError", "Error al guardar"));
    } finally {
      setSaving(false);
    }
  }

  const currentLabel = row.manager?.user?.name || row.manager?.position || null;

  return (
    <div className="relative inline-flex items-center gap-2" ref={popoverRef}>
      <span className="text-[var(--rowi-foreground)] text-sm">
        {currentLabel || "—"}
      </span>
      <button
        type="button"
        onClick={() => {
          setEditing((s) => !s);
          if (candidates !== null) setCandidates(null); // refetch when reopening
        }}
        className="text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
        title={t("admin.hr.manager.edit", "Editar manager")}
        disabled={saving}
      >
        <Pencil className="w-3 h-3" />
      </button>

      {editing && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--rowi-muted)]">
              {t("admin.hr.manager.pick", "Asignar manager")}
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => save(null)}
              disabled={saving}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                row.manager === null
                  ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                  : "hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-[var(--rowi-muted)]">
                —
              </span>
              <span className="flex-1">
                {t("admin.hr.manager.none", "Sin manager")}
              </span>
              {!row.manager && <Check className="w-3.5 h-3.5" />}
            </button>

            {loading && (
              <div className="px-3 py-4 flex items-center gap-2 text-sm text-[var(--rowi-muted)]">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("common.loading", "Cargando...")}
              </div>
            )}

            {!loading && candidates && candidates.length === 0 && (
              <div className="px-3 py-4 text-xs text-[var(--rowi-muted)]">
                {t(
                  "admin.hr.manager.noCandidates",
                  "No hay otros empleados activos en este tenant.",
                )}
              </div>
            )}

            {!loading &&
              candidates &&
              candidates.map((c) => {
                const isSelected = row.manager?.id === c.id;
                const label = c.user?.name || c.user?.email || c.position || "—";
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => save(c.id)}
                    disabled={saving}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      isSelected
                        ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium">
                      {(label[0] || "?").toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{label}</div>
                      {c.position && (
                        <div className="text-[10px] text-[var(--rowi-muted)] truncate">
                          {c.position}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
