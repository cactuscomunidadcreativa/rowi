"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Languages,
  Save,
  Download,
  Search,
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  Eye,
  Copy,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Globe,
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
   🌍 Rowi Admin — Translations Center (Safe Version)
   ---------------------------------------------------------
   - Lee y edita traducciones de los archivos JSON
   - Paginación completa para ver todas las claves
   - Agregar nuevos idiomas con traducción automática
   - Scan solo muestra reporte, NO modifica archivos
   - Guardado controlado con confirmación
========================================================= */

interface ScanReport {
  ok: boolean;
  summary: {
    keysFoundInCode: number;
    keysInEs: number;
    keysInEn: number;
    missingInEs: number;
    missingInEn: number;
    unusedInEs: number;
    unusedInEn: number;
  };
  missingKeys: {
    es: { key: string; usedIn: string[] }[];
    en: { key: string; usedIn: string[] }[];
  };
  unusedKeys: {
    es: string[];
    en: string[];
  };
  message: string;
}

const AVAILABLE_LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];

export default function TranslationsPage() {
  const { t, ready } = useI18n();
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "missing" | "filled">("all");
  const [selectedLang, setSelectedLang] = useState<string>("es");
  const [showScanReport, setShowScanReport] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [sourceLang, setSourceLang] = useState("es");
  const [translating, setTranslating] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Idiomas activos (los que tienen traducciones)
  const activeLangs = useMemo(() => {
    return Object.keys(translations).filter(lang =>
      translations[lang] && Object.keys(translations[lang]).length > 0
    );
  }, [translations]);

  // =========================================================
  // 📖 Cargar traducciones desde API
  // =========================================================
  async function loadTranslations() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/translations");
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      setTranslations(json);
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadTranslations();
  }, [ready]);

  // =========================================================
  // 💾 Guardar traducciones
  // =========================================================
  async function saveTranslations() {
    if (!confirm("¿Guardar cambios en los archivos de traducción?")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/hub/translations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(translations),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(t("admin.translations.saved"));
      loadTranslations();
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // 🔍 Escanear código (SOLO LECTURA)
  // =========================================================
  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/hub/translations/scan");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setScanReport(json);
      setShowScanReport(true);
      toast.success("Scan completado (solo lectura)");
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setScanning(false);
    }
  }

  // =========================================================
  // 🌐 Agregar nuevo idioma con traducción automática
  // =========================================================
  async function addLanguageWithTranslation() {
    if (!newLangCode) {
      toast.error("Selecciona un idioma");
      return;
    }

    if (activeLangs.includes(newLangCode)) {
      toast.error("Este idioma ya existe");
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch("/api/hub/translations/auto-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLang,
          targetLang: newLangCode,
          translations: translations[sourceLang] || {},
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al traducir");

      // Agregar las traducciones al estado
      setTranslations(prev => ({
        ...prev,
        [newLangCode]: json.translations,
      }));

      toast.success(`Idioma ${newLangCode.toUpperCase()} agregado con ${Object.keys(json.translations).length} traducciones`);
      setShowAddLanguage(false);
      setNewLangCode("");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t("common.error"));
    } finally {
      setTranslating(false);
    }
  }

  // =========================================================
  // 📥 Exportar CSV
  // =========================================================
  function exportCSV() {
    const allKeys = new Set<string>();
    activeLangs.forEach(lang => {
      if (translations[lang]) {
        Object.keys(translations[lang]).forEach(k => allKeys.add(k));
      }
    });

    const headers = ["Key", ...activeLangs.map(l => l.toUpperCase())];
    const rows = [headers];

    for (const key of Array.from(allKeys).sort()) {
      const row = [key];
      for (const lang of activeLangs) {
        row.push(translations[lang]?.[key] || "");
      }
      rows.push(row);
    }

    const csv = rows.map(r => r.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `translations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exportado");
  }

  // =========================================================
  // 📊 Estadísticas
  // =========================================================
  const stats = useMemo(() => {
    const result: Record<string, { total: number; filled: number; missing: number }> = {};

    activeLangs.forEach(lang => {
      const data = translations[lang] || {};
      const keys = Object.keys(data);
      const filled = keys.filter(k => data[k] && data[k].trim() !== "").length;
      result[lang] = {
        total: keys.length,
        filled,
        missing: keys.length - filled,
      };
    });

    return result;
  }, [translations, activeLangs]);

  // =========================================================
  // 🔎 Filtrar claves
  // =========================================================
  const filteredKeys = useMemo(() => {
    const allKeys = new Set<string>();
    activeLangs.forEach(lang => {
      if (translations[lang]) {
        Object.keys(translations[lang]).forEach(k => allKeys.add(k));
      }
    });

    const q = search.toLowerCase().trim();

    return Array.from(allKeys)
      .filter(key => {
        // Búsqueda
        if (q) {
          let searchText = key;
          activeLangs.forEach(lang => {
            searchText += " " + (translations[lang]?.[key] || "");
          });
          if (!searchText.toLowerCase().includes(q)) return false;
        }

        // Filtro por estado
        if (filterMode === "missing") {
          const val = translations[selectedLang]?.[key] || "";
          if (val.trim() !== "") return false;
        }
        if (filterMode === "filled") {
          const val = translations[selectedLang]?.[key] || "";
          if (val.trim() === "") return false;
        }

        return true;
      })
      .sort();
  }, [translations, search, filterMode, selectedLang, activeLangs]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode, selectedLang, pageSize]);

  // =========================================================
  // 📄 Paginación
  // =========================================================
  const totalPages = Math.ceil(filteredKeys.length / pageSize);
  const paginatedKeys = filteredKeys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // =========================================================
  // ✏️ Actualizar traducción
  // =========================================================
  function updateTranslation(lang: string, key: string, value: string) {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [key]: value,
      },
    }));
  }

  // =========================================================
  // 📋 Copiar clave faltante
  // =========================================================
  function copyMissingKey(key: string) {
    navigator.clipboard.writeText(`"${key}": "",`);
    toast.success("Clave copiada");
  }

  return (
    <AdminPage
      titleKey="admin.translations.title"
      descriptionKey="admin.translations.description"
      icon={Languages}
      loading={loading}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <AdminButton
            variant="secondary"
            icon={Plus}
            onClick={() => setShowAddLanguage(true)}
            size="sm"
          >
            Agregar Idioma
          </AdminButton>
          <AdminButton
            variant="secondary"
            icon={scanning ? Loader2 : Search}
            onClick={runScan}
            disabled={scanning}
            size="sm"
          >
            {scanning ? "Escaneando..." : "Scan"}
          </AdminButton>
          <AdminButton variant="secondary" icon={Download} onClick={exportCSV} size="sm">
            CSV
          </AdminButton>
          <AdminButton icon={Save} onClick={saveTranslations} loading={saving} size="sm">
            Guardar
          </AdminButton>
        </div>
      }
    >
      {/* Add Language Modal */}
      {showAddLanguage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--rowi-card)] rounded-xl max-w-md w-full shadow-xl">
            <div className="p-4 border-b border-[var(--rowi-border)] flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Agregar Nuevo Idioma
              </h3>
              <button onClick={() => setShowAddLanguage(false)} className="p-1 hover:bg-[var(--rowi-border)] rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nuevo idioma</label>
                <select
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
                >
                  <option value="">Seleccionar idioma...</option>
                  {AVAILABLE_LANGUAGES.filter(l => !activeLangs.includes(l.code)).map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Traducir desde</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
                >
                  {activeLangs.map(lang => {
                    const langInfo = AVAILABLE_LANGUAGES.find(l => l.code === lang);
                    return (
                      <option key={lang} value={lang}>
                        {langInfo?.flag || "🌐"} {langInfo?.name || lang.toUpperCase()} ({stats[lang]?.total || 0} claves)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400">Traducción automática con IA</p>
                    <p className="text-xs text-[var(--rowi-muted)] mt-1">
                      Se generarán traducciones automáticas para todas las {stats[sourceLang]?.total || 0} claves.
                      Podrás editarlas después si es necesario.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <AdminButton variant="secondary" onClick={() => setShowAddLanguage(false)}>
                  Cancelar
                </AdminButton>
                <AdminButton
                  icon={translating ? Loader2 : Sparkles}
                  onClick={addLanguageWithTranslation}
                  loading={translating}
                  disabled={!newLangCode || translating}
                >
                  {translating ? "Traduciendo..." : "Generar Traducciones"}
                </AdminButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Report Modal */}
      {showScanReport && scanReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--rowi-card)] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-[var(--rowi-border)] flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reporte de Scan (Solo Lectura)
              </h3>
              <AdminButton variant="ghost" size="sm" onClick={() => setShowScanReport(false)}>
                Cerrar
              </AdminButton>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[var(--rowi-background)]">
                  <div className="text-2xl font-bold">{scanReport.summary.keysFoundInCode}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">Claves en código</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)]">
                  <div className="text-2xl font-bold text-green-500">{scanReport.summary.keysInEs}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">Claves en ES</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)]">
                  <div className="text-2xl font-bold text-blue-500">{scanReport.summary.keysInEn}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">Claves en EN</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)]">
                  <div className="text-2xl font-bold text-orange-500">
                    {scanReport.summary.missingInEs + scanReport.summary.missingInEn}
                  </div>
                  <div className="text-xs text-[var(--rowi-muted)]">Total faltantes</div>
                </div>
              </div>

              {/* Missing Keys */}
              {(scanReport.missingKeys.es.length > 0 || scanReport.missingKeys.en.length > 0) && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="w-4 h-4" />
                    Claves usadas en código pero no en traducciones
                  </h4>

                  {scanReport.missingKeys.es.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Faltantes en ES ({scanReport.summary.missingInEs}):
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {scanReport.missingKeys.es.map(({ key }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-xs p-2 bg-[var(--rowi-background)] rounded group"
                          >
                            <code className="flex-1 text-orange-500">{key}</code>
                            <button
                              onClick={() => copyMissingKey(key)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scanReport.missingKeys.en.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Faltantes en EN ({scanReport.summary.missingInEn}):
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {scanReport.missingKeys.en.map(({ key }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-xs p-2 bg-[var(--rowi-background)] rounded group"
                          >
                            <code className="flex-1 text-blue-500">{key}</code>
                            <button
                              onClick={() => copyMissingKey(key)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Good */}
              {scanReport.summary.missingInEs === 0 && scanReport.summary.missingInEn === 0 && (
                <div className="flex items-center gap-2 text-green-500 p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>Todas las claves usadas en el código tienen traducción</span>
                </div>
              )}

              <p className="text-xs text-[var(--rowi-muted)] mt-4">
                Este scan es de SOLO LECTURA. No se modificaron archivos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
        <span className="text-[var(--rowi-muted)]">
          Total: <b className="text-[var(--rowi-foreground)]">{filteredKeys.length}</b> claves
        </span>
        <div className="flex gap-3 flex-wrap">
          {activeLangs.map(l => {
            const langInfo = AVAILABLE_LANGUAGES.find(lang => lang.code === l);
            return (
              <div key={l} className="flex items-center gap-1.5">
                <span className="text-sm">{langInfo?.flag || "🌐"}</span>
                <span className="font-semibold uppercase text-[var(--rowi-foreground)]">{l}</span>
                <AdminBadge variant="success">{stats[l]?.filled || 0}</AdminBadge>
                {(stats[l]?.missing || 0) > 0 && (
                  <AdminBadge variant="warning">{stats[l]?.missing}</AdminBadge>
                )}
              </div>
            );
          })}
        </div>
        {scanReport && (
          <AdminButton variant="ghost" size="xs" icon={Eye} onClick={() => setShowScanReport(true)}>
            Ver scan
          </AdminButton>
        )}
      </div>

      {/* Filters */}
      <AdminCard className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <AdminInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar clave o valor..."
            />
          </div>
          <AdminSelect
            value={filterMode}
            onChange={(v) => setFilterMode(v as "all" | "missing" | "filled")}
            options={[
              { value: "all", label: "Todas" },
              { value: "filled", label: "Traducidas" },
              { value: "missing", label: "Sin traducir" },
            ]}
          />
          <AdminSelect
            value={selectedLang}
            onChange={(v) => setSelectedLang(v)}
            options={activeLangs.map(l => ({ value: l, label: `Filtrar por ${l.toUpperCase()}` }))}
          />
          <AdminSelect
            value={pageSize.toString()}
            onChange={(v) => setPageSize(parseInt(v))}
            options={PAGE_SIZE_OPTIONS.map(n => ({ value: n.toString(), label: `${n} por página` }))}
          />
        </div>
      </AdminCard>

      {/* Translation Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--rowi-surface)] border-b border-[var(--rowi-border)] z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-[var(--rowi-muted)] w-1/4">Clave</th>
                {activeLangs.map(lang => {
                  const langInfo = AVAILABLE_LANGUAGES.find(l => l.code === lang);
                  return (
                    <th key={lang} className="px-3 py-2 text-left font-medium text-[var(--rowi-muted)]">
                      {langInfo?.flag || "🌐"} {lang.toUpperCase()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rowi-border)]">
              {paginatedKeys.map(key => {
                return (
                  <tr key={key} className="hover:bg-[var(--rowi-background)]">
                    <td className="px-3 py-1.5">
                      <code className="text-[10px] text-[var(--rowi-muted)] bg-[var(--rowi-background)] px-1 py-0.5 rounded break-all">
                        {key}
                      </code>
                    </td>
                    {activeLangs.map(lang => {
                      const val = translations[lang]?.[key] || "";
                      const isEmpty = !val.trim();
                      return (
                        <td key={lang} className="px-1 py-0.5">
                          <textarea
                            value={val}
                            onChange={(e) => updateTranslation(lang, key, e.target.value)}
                            rows={1}
                            className={`w-full resize-none text-xs px-2 py-1 rounded border transition-colors ${
                              isEmpty
                                ? "bg-orange-500/10 border-orange-500/30"
                                : "bg-[var(--rowi-surface)] border-[var(--rowi-border)]"
                            } focus:ring-1 focus:ring-[var(--rowi-primary)] outline-none`}
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

          {filteredKeys.length === 0 && (
            <div className="p-8 text-center text-[var(--rowi-muted)]">
              No se encontraron traducciones
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--rowi-border)] bg-[var(--rowi-surface)]">
            <div className="text-xs text-[var(--rowi-muted)]">
              Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredKeys.length)} de {filteredKeys.length} claves
            </div>
            <div className="flex items-center gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </AdminButton>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs rounded ${
                        currentPage === pageNum
                          ? "bg-[var(--rowi-primary)] text-white"
                          : "bg-[var(--rowi-background)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </AdminButton>
            </div>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
