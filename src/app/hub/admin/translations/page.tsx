"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Languages,
  RefreshCcw,
  Save,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminPage";

/* =========================================================
   🌍 Rowi Admin — Translations Center
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

export default function TranslationsPage() {
  const { t, ready } = useI18n();
  const [matrix, setMatrix] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [langs, setLangs] = useState(["es", "en"]);
  const [search, setSearch] = useState("");
  const [selectedNs, setSelectedNs] = useState("ALL");
  const [knownNamespaces, setKnownNamespaces] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "translated" | "missing">("all");
  const [filterLang, setFilterLang] = useState<string>("es");
  const [translating, setTranslating] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/translations?format=list");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const list = json.rows || json.missing || json || [];
      const all: Record<string, any> = {};
      const namespacesSet = new Set<string>();

      list.forEach((item: any) => {
        const ns = item.ns || "global";
        namespacesSet.add(ns);
        const full = `${ns}.${item.key}`;
        all[full] = {};
        langs.forEach((lang) => {
          all[full][lang] = { value: item[lang] || "" };
        });
        all[full]._ns = ns;
        all[full]._key = item.key;
      });

      setMatrix(all);
      setKnownNamespaces(Array.from(namespacesSet).sort());
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAll();
  }, [ready]);

  async function saveAll() {
    setSaving(true);
    try {
      const updates = Object.entries(matrix).flatMap(([_, row]) =>
        langs.map((lang) => ({
          ns: row._ns,
          key: row._key,
          lang,
          value: row[lang]?.value || "",
        }))
      );

      const res = await fetch("/api/hub/translations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(t("admin.translations.saved"));
      loadAll();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function scanSystem() {
    try {
      toast.info(t("admin.translations.scanning"));
      const res = await fetch("/api/hub/translations/scan");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t("admin.translations.scanComplete"));
      loadAll();
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function autoTranslate(targetLang: string, sourceLang: string = "es") {
    const pending = Object.values(matrix).filter(
      (r: any) => !r[targetLang]?.value || r[targetLang]?.value.trim() === ""
    );
    if (pending.length === 0) {
      toast.info(t("admin.translations.noPending"));
      return;
    }

    setTranslating(targetLang);
    setProgress({ done: 0, total: pending.length });

    try {
      const batchSize = 30;
      for (let i = 0; i < pending.length; i += batchSize) {
        const batch = pending.slice(i, i + batchSize).map((r: any) => ({
          ns: r._ns,
          key: r._key,
          value: r[sourceLang]?.value || r._key,
        }));

        const res = await fetch("/api/hub/translations/auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: batch, lang: targetLang }),
        });

        const j = await res.json();
        if (!res.ok) throw new Error(j.error);

        const translatedArray = Array.isArray(j) ? j : j.translations || j.data || [];

        setMatrix((prev) => {
          const updated = { ...prev };
          translatedArray.forEach((t: any) => {
            const full = `${t.ns}.${t.key}`;
            if (updated[full]) {
              updated[full][targetLang] = { value: t.value };
            }
          });
          return updated;
        });

        setProgress((p) => ({ done: Math.min(p.done + batch.length, pending.length), total: pending.length }));
        await new Promise((r) => setTimeout(r, 150));
      }

      toast.success(t("admin.translations.autoComplete"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setTranslating(null);
      setProgress({ done: 0, total: 0 });
    }
  }

  function exportCSV() {
    const rows = [["Namespace", "Key", ...langs.map((l) => l.toUpperCase())]];
    for (const fullKey in matrix) {
      const row = matrix[fullKey];
      rows.push([row._ns, row._key, ...langs.map((l) => row[l]?.value || "")]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `translations-${Date.now()}.csv`;
    a.click();
  }

  async function importCSV(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    toast.info(t("admin.translations.importing"));
    try {
      const res = await fetch("/api/hub/translations/import", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        toast.success(t("admin.translations.importComplete"));
        await loadAll();
      } else toast.error(json.error);
    } catch {
      toast.error(t("common.error"));
    }
  }

  const translationStats = useMemo(() => {
    const stats: Record<string, { missing: number; filled: number; total: number }> = {};
    langs.forEach((l) => (stats[l] = { missing: 0, filled: 0, total: 0 }));
    Object.values(matrix).forEach((row: any) => {
      langs.forEach((l) => {
        stats[l].total++;
        if (!row[l]?.value || row[l]?.value.trim() === "") stats[l].missing++;
        else stats[l].filled++;
      });
    });
    return stats;
  }, [matrix, langs]);

  const filteredKeys = useMemo(() => {
    const out: string[] = [];
    const q = search.trim().toLowerCase();

    for (const k of Object.keys(matrix)) {
      const row = matrix[k];
      const textParts: string[] = [row._ns, row._key];
      langs.forEach((lang) => {
        const val = row[lang]?.value || "";
        if (val) textParts.push(val);
      });

      const fullText = textParts.join(" ").toLowerCase();

      if (selectedNs !== "ALL" && row._ns !== selectedNs) continue;
      if (q && !fullText.includes(q)) continue;

      const value = row[filterLang]?.value || "";
      const isMissing = !value || value.trim() === "";
      if (filterMode === "missing" && !isMissing) continue;
      if (filterMode === "translated" && isMissing) continue;

      out.push(k);
    }
    return out;
  }, [matrix, langs, search, selectedNs, filterMode, filterLang]);

  const totalCount = Object.keys(matrix).length;

  return (
    <AdminPage
      titleKey="admin.translations.title"
      descriptionKey="admin.translations.description"
      icon={Languages}
      loading={loading}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={scanSystem} size="sm">
            {t("admin.translations.scan")}
          </AdminButton>
          <AdminButton variant="secondary" icon={Download} onClick={exportCSV} size="sm">
            CSV
          </AdminButton>
          <label className="cursor-pointer">
            <AdminButton variant="secondary" icon={Upload} size="sm" as="span">
              {t("admin.translations.import")}
            </AdminButton>
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <AdminButton icon={Save} onClick={saveAll} loading={saving} size="sm">
            {t("admin.common.save")}
          </AdminButton>
        </div>
      }
    >
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
        <span className="text-[var(--rowi-muted)]">
          Total: <b className="text-[var(--rowi-foreground)]">{totalCount}</b> —
          {t("admin.translations.showing")} <b className="text-[var(--rowi-foreground)]">{filteredKeys.length}</b>
        </span>
        <div className="flex gap-3">
          {langs.map((l) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="font-semibold uppercase text-[var(--rowi-foreground)]">{l}</span>
              <AdminBadge variant="success">{translationStats[l].filled}</AdminBadge>
              <AdminBadge variant="warning">{translationStats[l].missing}</AdminBadge>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <AdminCard className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <AdminInput
              value={search}
              onChange={setSearch}
              placeholderKey="admin.translations.searchPlaceholder"
            />
          </div>
          <AdminSelect
            value={selectedNs}
            onChange={setSelectedNs}
            options={[
              { value: "ALL", label: t("admin.translations.allNamespaces") },
              ...knownNamespaces.map((ns) => ({ value: ns, label: ns })),
            ]}
          />
          <AdminSelect
            value={filterMode}
            onChange={(v) => setFilterMode(v as any)}
            options={[
              { value: "all", label: t("admin.translations.all") },
              { value: "translated", label: t("admin.translations.translated") },
              { value: "missing", label: t("admin.translations.missing") },
            ]}
          />
          <AdminSelect
            value={filterLang}
            onChange={setFilterLang}
            options={langs.map((l) => ({ value: l, label: `Base: ${l.toUpperCase()}` }))}
          />
        </div>

        {/* Auto-translate buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--rowi-border)]">
          {langs.map((l) => (
            <AdminButton
              key={l}
              variant="ghost"
              size="xs"
              icon={Sparkles}
              onClick={() => autoTranslate(l)}
              disabled={translating !== null}
            >
              Auto {l.toUpperCase()}
              {translationStats[l].missing > 0 && (
                <span className="ml-1 text-[var(--rowi-warning)]">({translationStats[l].missing})</span>
              )}
            </AdminButton>
          ))}
          {translating && (
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-muted)]">
              <Loader2 className="w-3 h-3 animate-spin" />
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
      </AdminCard>

      {/* Translation Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--rowi-surface)] border-b border-[var(--rowi-border)] z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-[var(--rowi-muted)] w-28">NS</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--rowi-muted)] w-40">Key</th>
                {langs.map((l) => (
                  <th key={l} className="px-3 py-2 text-center font-medium text-[var(--rowi-muted)] uppercase">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rowi-border)]">
              {filteredKeys.slice(0, 100).map((k) => {
                const row = matrix[k];
                return (
                  <tr key={k} className="hover:bg-[var(--rowi-background)]">
                    <td className="px-3 py-1.5 text-[var(--rowi-foreground)] font-medium">{row._ns}</td>
                    <td className="px-3 py-1.5">
                      <code className="text-[10px] text-[var(--rowi-muted)] bg-[var(--rowi-background)] px-1 py-0.5 rounded break-all">
                        {row._key}
                      </code>
                    </td>
                    {langs.map((lang) => {
                      const cell = row[lang] || {};
                      const val = cell.value || "";
                      const isEmpty = !val || val.trim() === "";
                      return (
                        <td key={lang} className="px-1 py-0.5">
                          <textarea
                            value={val}
                            onChange={(e) =>
                              setMatrix((prev) => ({
                                ...prev,
                                [k]: {
                                  ...prev[k],
                                  [lang]: { ...cell, value: e.target.value },
                                },
                              }))
                            }
                            rows={1}
                            className={`w-full resize-none text-xs px-2 py-1 rounded border transition-colors ${
                              isEmpty
                                ? "bg-[var(--rowi-warning)]/10 border-[var(--rowi-warning)]/30 text-[var(--rowi-foreground)]"
                                : "bg-[var(--rowi-surface)] border-[var(--rowi-border)] text-[var(--rowi-foreground)]"
                            } focus:ring-1 focus:ring-[var(--rowi-primary)] focus:border-[var(--rowi-primary)] outline-none`}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredKeys.length > 100 && (
            <div className="p-4 text-center text-xs text-[var(--rowi-muted)] border-t border-[var(--rowi-border)]">
              {t("admin.translations.showingFirst")} 100 / {filteredKeys.length}
            </div>
          )}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
