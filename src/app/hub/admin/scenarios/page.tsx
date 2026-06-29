"use client";

/**
 * /hub/admin/scenarios — carga y gestión del ScenarioBank multi-idioma (Track B).
 *
 * Un escenario = una fila con sus traducciones (es/en/pt/it/zh). El admin
 * escribe el idioma base, pulsa "Traducir con IA" y edita cada versión en
 * pestañas. El usuario practica en SU idioma. Todas las cadenas de UI pasan por
 * t() (es/en/pt/it/zh).
 */

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Plus, Trash2, Loader2, Pencil, Theater, Search, X, Languages, Globe2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const LOCALES = ["es", "en", "pt", "it", "zh"] as const;
type Loc = (typeof LOCALES)[number];
const SEI_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

interface LocFields {
  title: string;
  summary: string;
  brief: string;
}

interface Scenario {
  id: string;
  title: string;
  summary: string | null;
  brief: string;
  baseLocale: string;
  locale: string;
  translations: Record<string, Partial<LocFields>> | null;
  focusSei: string | null;
  difficulty: number;
  isActive: boolean;
  usageCount: number;
  rubric: unknown;
}

const DEFAULT_RUBRIC =
  '{\n  "criteria": [\n    { "key": "empathy", "label": "Empatía y escucha", "weight": 1 },\n    { "key": "clarity", "label": "Claridad y asertividad", "weight": 1 },\n    { "key": "outcome", "label": "Avance hacia el objetivo", "weight": 1 }\n  ]\n}';

function emptyLoc(): LocFields {
  return { title: "", summary: "", brief: "" };
}

function emptyForm() {
  return {
    id: "",
    baseLocale: "es" as Loc,
    translations: { es: emptyLoc() } as Record<string, LocFields>,
    focusSei: "",
    difficulty: 1,
    rubric: DEFAULT_RUBRIC,
    isActive: true,
  };
}

export default function ScenariosAdminPage() {
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [activeTab, setActiveTab] = useState<Loc>("es");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scenarios?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setScenarios(Array.isArray(json.scenarios) ? json.scenarios : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  function resetForm() {
    setForm(emptyForm());
    setActiveTab("es");
    setEditing(false);
    setError(null);
  }

  function startEdit(s: Scenario) {
    const base = (LOCALES.includes(s.baseLocale as Loc) ? s.baseLocale : "es") as Loc;
    const translations: Record<string, LocFields> = {};
    for (const l of LOCALES) {
      const tr = s.translations?.[l];
      if (tr) {
        translations[l] = {
          title: tr.title ?? "",
          summary: tr.summary ?? "",
          brief: tr.brief ?? "",
        };
      }
    }
    if (!translations[base]) {
      translations[base] = { title: s.title, summary: s.summary ?? "", brief: s.brief };
    }
    setForm({
      id: s.id,
      baseLocale: base,
      translations,
      focusSei: s.focusSei ?? "",
      difficulty: s.difficulty,
      rubric: JSON.stringify(s.rubric ?? {}, null, 2),
      isActive: s.isActive,
    });
    setActiveTab(base);
    setEditing(true);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setLocField(loc: Loc, field: keyof LocFields, value: string) {
    setForm((f) => ({
      ...f,
      translations: {
        ...f.translations,
        [loc]: { ...(f.translations[loc] ?? emptyLoc()), [field]: value },
      },
    }));
  }

  async function translate() {
    const base = form.translations[form.baseLocale];
    if (!base?.title?.trim() || !base?.brief?.trim()) {
      setError("base.required");
      return;
    }
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          baseLocale: form.baseLocale,
          title: base.title,
          summary: base.summary,
          brief: base.brief,
          rubric: form.rubric,
          translations: form.translations,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "error");
        return;
      }
      // Volcar las traducciones devueltas al form.
      const next: Record<string, LocFields> = { ...form.translations };
      for (const l of LOCALES) {
        const tr = json.translations?.[l];
        if (tr) next[l] = { title: tr.title ?? "", summary: tr.summary ?? "", brief: tr.brief ?? "" };
      }
      setForm((f) => ({ ...f, translations: next }));
    } catch {
      setError("server.error");
    } finally {
      setTranslating(false);
    }
  }

  async function save() {
    const base = form.translations[form.baseLocale];
    if (!base?.title?.trim() || !base?.brief?.trim()) {
      setError("base.required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/scenarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: form.id } : {}),
          baseLocale: form.baseLocale,
          translations: form.translations,
          focusSei: form.focusSei,
          difficulty: form.difficulty,
          rubric: form.rubric,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "error");
        return;
      }
      resetForm();
      await fetchScenarios(search);
    } catch {
      setError("server.error");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete(id: string) {
    setConfirmDelete(null);
    await fetch(`/api/admin/scenarios?id=${id}`, { method: "DELETE" });
    await fetchScenarios(search);
  }

  const cur = form.translations[activeTab] ?? emptyLoc();
  const isBase = activeTab === form.baseLocale;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Theater className="w-6 h-6 text-[var(--rowi-g2)]" />
        <div>
          <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
            {t("scenarios.title", "Banco de escenarios de práctica")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)]">
            {t(
              "scenarios.subtitle",
              "Sube el guion que la IA interpreta y la rúbrica de evaluación. Alimenta el AI Practice Partner.",
            )}
          </p>
        </div>
      </div>

      {/* Formulario crear/editar */}
      <div className="rowi-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--rowi-foreground)]">
            {editing
              ? t("scenarios.editTitle", "Editar escenario")
              : t("scenarios.newTitle", "Nuevo escenario")}
          </h2>
          {editing && (
            <button
              onClick={resetForm}
              className="text-xs text-[var(--rowi-muted)] flex items-center gap-1 hover:text-[var(--rowi-foreground)]"
            >
              <X className="w-3 h-3" /> {t("scenarios.cancel", "Cancelar")}
            </button>
          )}
        </div>

        {/* Idioma base */}
        <div className="flex items-center gap-2 text-sm">
          <Globe2 className="w-4 h-4 text-[var(--rowi-muted)]" />
          <span className="text-[var(--rowi-muted)]">{t("scenarios.field.baseLocale", "Idioma base")}</span>
          <select
            className="rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-2 py-1 text-sm"
            value={form.baseLocale}
            onChange={(e) => {
              const bl = e.target.value as Loc;
              setForm((f) => ({
                ...f,
                baseLocale: bl,
                translations: { ...f.translations, [bl]: f.translations[bl] ?? emptyLoc() },
              }));
              setActiveTab(bl);
            }}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--rowi-muted-weak)]">
            {t("scenarios.baseHint", "Escribe en este idioma y traduce con IA.")}
          </span>
        </div>

        {/* Pestañas de idioma */}
        <div className="flex items-center gap-1 border-b border-[var(--rowi-card-border)]">
          {LOCALES.map((l) => {
            const has = !!form.translations[l]?.title;
            return (
              <button
                key={l}
                onClick={() => setActiveTab(l)}
                className={`px-3 py-1.5 text-sm border-b-2 -mb-px transition-colors ${
                  activeTab === l
                    ? "border-[var(--rowi-g2)] text-[var(--rowi-foreground)] font-medium"
                    : "border-transparent text-[var(--rowi-muted)]"
                }`}
              >
                {l}
                {l === form.baseLocale && <span className="ml-1 text-[10px] text-[var(--rowi-g2)]">●</span>}
                {!has && l !== form.baseLocale && (
                  <span className="ml-1 text-[10px] text-[var(--rowi-muted-weak)]">∅</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Campos del idioma activo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.title", "Título")}</span>
            <input
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={cur.title}
              onChange={(e) => setLocField(activeTab, "title", e.target.value)}
              placeholder={t("scenarios.ph.title", "Conversación difícil con un cliente")}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.summary", "Resumen")}</span>
            <input
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={cur.summary}
              onChange={(e) => setLocField(activeTab, "summary", e.target.value)}
              placeholder={t("scenarios.ph.summary", "Descripción corta para la lista")}
            />
          </label>
        </div>

        <label className="text-sm block">
          <span className="text-[var(--rowi-muted)]">{t("scenarios.field.brief", "Brief (lo que la IA interpreta)")}</span>
          <textarea
            className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm font-mono min-h-[120px]"
            value={cur.brief}
            onChange={(e) => setLocField(activeTab, "brief", e.target.value)}
            placeholder={t(
              "scenarios.ph.brief",
              "Eres un cliente molesto porque su pedido llegó tarde. Eres firme pero razonable...",
            )}
          />
        </label>

        {/* Botón traducir (solo en la pestaña base) */}
        {isBase && (
          <button
            onClick={translate}
            disabled={translating}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-[var(--rowi-g2)]/40 text-[var(--rowi-g2)] hover:bg-[var(--rowi-g2)]/10 disabled:opacity-50"
          >
            {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            {t("scenarios.translate", "Traducir con IA a los demás idiomas")}
          </button>
        )}

        {/* Metadatos comunes (no por idioma) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[var(--rowi-card-border)]">
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.focusSei", "Foco SEI")}</span>
            <select
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={form.focusSei}
              onChange={(e) => setForm({ ...form, focusSei: e.target.value })}
            >
              <option value="">{t("scenarios.focus.auto", "Automático")}</option>
              {SEI_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.difficulty", "Dificultad")}</span>
            <select
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.active", "Activo")}</span>
          </label>
        </div>

        <label className="text-sm block">
          <span className="text-[var(--rowi-muted)]">{t("scenarios.field.rubric", "Rúbrica (JSON)")}</span>
          <textarea
            className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-xs font-mono min-h-[140px]"
            value={form.rubric}
            onChange={(e) => setForm({ ...form, rubric: e.target.value })}
          />
        </label>

        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {t("scenarios.error." + error, error)}
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="rowi-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {editing ? t("scenarios.save", "Guardar cambios") : t("scenarios.create", "Crear escenario")}
        </button>
      </div>

      {/* Búsqueda + lista */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rowi-muted)]" />
          <input
            className="w-full rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] pl-9 pr-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchScenarios(search)}
            placeholder={t("scenarios.search", "Buscar escenarios…")}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : scenarios.length === 0 ? (
        <p className="text-center text-sm text-[var(--rowi-muted)] py-8">
          {t("scenarios.empty", "Aún no hay escenarios. Crea el primero arriba.")}
        </p>
      ) : (
        <div className="space-y-2">
          {scenarios.map((s) => {
            const langs = LOCALES.filter((l) => s.translations?.[l]?.title);
            return (
              <div key={s.id} className="rowi-card flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--rowi-foreground)]">{s.title}</span>
                    {s.focusSei && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
                        {s.focusSei}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--rowi-muted-weak)]">
                      {t("scenarios.difficulty.short", "Dif.")} {s.difficulty}
                    </span>
                    {!s.isActive && (
                      <span className="text-[10px] text-rose-500">
                        {t("scenarios.inactive", "inactivo")}
                      </span>
                    )}
                  </div>
                  {s.summary && (
                    <p className="text-sm text-[var(--rowi-muted)] line-clamp-1 mt-0.5">{s.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[var(--rowi-muted-weak)] flex items-center gap-1">
                      <Globe2 className="w-3 h-3" />
                      {(langs.length ? langs : [s.baseLocale]).join(" · ")}
                    </span>
                    <span className="text-[11px] text-[var(--rowi-muted-weak)]">
                      {t("scenarios.usage", "Usos")}: {s.usageCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 rounded-lg hover:bg-[var(--rowi-card-elev)] text-[var(--rowi-muted)]"
                    title={t("scenarios.edit", "Editar")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s.id)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500"
                    title={t("scenarios.delete", "Eliminar")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={t("scenarios.confirmDelete.title", "¿Eliminar escenario?")}
        message={t(
          "scenarios.confirmDelete.message",
          "Esta acción no se puede deshacer. Las sesiones ya realizadas se conservan.",
        )}
        confirmLabel={t("scenarios.delete", "Eliminar")}
        cancelLabel={t("scenarios.cancel", "Cancelar")}
        onConfirm={() => confirmDelete && doDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
