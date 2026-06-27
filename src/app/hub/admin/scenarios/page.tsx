"use client";

/**
 * /hub/admin/scenarios — carga y gestión del ScenarioBank (Track B).
 *
 * El admin sube el "guion" del cliente (brief que la IA interpreta) + una
 * rúbrica de evaluación. Listo para los scripts reales del cliente. Todas las
 * cadenas pasan por t() (es/en/pt/it/zh).
 */

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Plus, Trash2, Loader2, Pencil, Theater, Search, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Scenario {
  id: string;
  title: string;
  summary: string | null;
  brief: string;
  locale: string;
  focusSei: string | null;
  difficulty: number;
  isActive: boolean;
  usageCount: number;
  rubric: unknown;
}

const LOCALES = ["es", "en", "pt", "it", "zh"];
const SEI_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

const EMPTY_FORM = {
  id: "",
  title: "",
  summary: "",
  brief: "",
  locale: "es",
  focusSei: "",
  difficulty: 1,
  rubric: '{\n  "criteria": [\n    { "key": "empathy", "label": "Empatía y escucha", "weight": 1 },\n    { "key": "clarity", "label": "Claridad y asertividad", "weight": 1 },\n    { "key": "outcome", "label": "Avance hacia el objetivo", "weight": 1 }\n  ]\n}',
  isActive: true,
};

export default function ScenariosAdminPage() {
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
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
    setForm({ ...EMPTY_FORM });
    setEditing(false);
    setError(null);
  }

  function startEdit(s: Scenario) {
    setForm({
      id: s.id,
      title: s.title,
      summary: s.summary ?? "",
      brief: s.brief,
      locale: s.locale,
      focusSei: s.focusSei ?? "",
      difficulty: s.difficulty,
      rubric: JSON.stringify(s.rubric ?? {}, null, 2),
      isActive: s.isActive,
    });
    setEditing(true);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/scenarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.title", "Título")}</span>
            <input
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t("scenarios.ph.title", "Conversación difícil con un cliente")}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.summary", "Resumen")}</span>
            <input
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder={t("scenarios.ph.summary", "Descripción corta para la lista")}
            />
          </label>
        </div>

        <label className="text-sm block">
          <span className="text-[var(--rowi-muted)]">{t("scenarios.field.brief", "Brief (lo que la IA interpreta)")}</span>
          <textarea
            className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm font-mono min-h-[120px]"
            value={form.brief}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            placeholder={t(
              "scenarios.ph.brief",
              "Eres un cliente molesto porque su pedido llegó tarde. Eres firme pero razonable...",
            )}
          />
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-sm">
            <span className="text-[var(--rowi-muted)]">{t("scenarios.field.locale", "Idioma")}</span>
            <select
              className="w-full mt-1 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm"
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
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
          {scenarios.map((s) => (
            <div key={s.id} className="rowi-card flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[var(--rowi-foreground)]">{s.title}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--rowi-card-elev)] text-[var(--rowi-muted)]">
                    {s.locale}
                  </span>
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
                <p className="text-[11px] text-[var(--rowi-muted-weak)] mt-1">
                  {t("scenarios.usage", "Usos")}: {s.usageCount}
                </p>
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
          ))}
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
