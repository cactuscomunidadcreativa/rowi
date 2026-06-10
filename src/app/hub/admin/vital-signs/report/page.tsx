"use client";

/**
 * 🔬 Rowi Consultor — Informe SEI ↔ Vital Signs.
 *
 * Flujo que pidió Eduardo:
 *   1. Subir SEI (CSV).
 *   2. Subir VS (LVS/TVS/OVS, CSV).
 *   3. Generar → entregable formato Rowi (modelo perfil de Carolina):
 *      SEI (barras) + VS + mapa de puntos ciegos + diagnóstico.
 *
 * TVS/OVS = cohorte agregado anónimo. LVS = líder individual. El backend
 * (/api/consultant/report) parsea ambos CSV en memoria (no persiste) y cruza.
 */
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  exportClientPptx,
  exportConfidentialPptx,
  type ConsultantReportData,
  type EngineInsightData,
} from "@/lib/consultant/pptx-export";

const SEI_LABEL: Record<string, string> = {
  EL: "Alfabetización Emocional", RP: "Reconocer Patrones", ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones", IM: "Motivación Intrínseca", OP: "Optimismo",
  EMP: "Empatía", NG: "Metas Nobles",
};
const PULSE_LABEL: Record<string, string> = {
  TRUST_TRANSPARENCY: "Transparencia", TRUST_COHERENCE: "Coherencia", TRUST_CARE: "Cuidado",
  MOTIVATION_MEANING: "Significado", MOTIVATION_MASTERY: "Maestría", MOTIVATION_AUTONOMY: "Autonomía",
  CHANGE_IMAGINATION: "Imaginación", CHANGE_EXPLORATION: "Exploración", CHANGE_CELEBRATION: "Celebración",
  TEAMWORK_DIVERGENCE: "Divergencia", TEAMWORK_CONNECTION: "Conexión", TEAMWORK_JOY: "Alegría",
  EXECUTION_ACCOUNTABILITY: "Responsabilidad", EXECUTION_FEEDBACK: "Feedback", EXECUTION_FOCUS: "Enfoque",
};
const STATE_STYLE: Record<string, { label: string; cls: string }> = {
  alineado: { label: "Alineado", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  punto_ciego: { label: "Punto ciego", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  oculto: { label: "Oculto", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  neutral: { label: "Neutral", cls: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400" },
};

// Tipos del informe: viven en pptx-export.ts (los comparte página y export).
type EngineInsight = EngineInsightData;
type ReportResult = ConsultantReportData;

/** Lista de insights con sus marcas de honestidad. */
function InsightList({ items }: { items: EngineInsight[] }) {
  if (!items?.length) return <p className="text-sm text-[var(--rowi-muted)]">Sin señales en este nivel.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="text-sm text-[var(--rowi-fg)] flex gap-2">
          <span className="text-[var(--rowi-muted)]">·</span>
          <span>
            {it.reading}
            {it.flags.smallN && <span className="ml-1 text-xs text-amber-600">[n pequeño]</span>}
            {it.flags.highDispersion && <span className="ml-1 text-xs text-amber-600">[DE alta]</span>}
            {it.flags.isWellbeing && <span className="ml-1 text-xs text-rose-600">[bienestar]</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Barra 70-130 estilo Rowi (verde si alto, ámbar si medio/bajo). */
function Bar({ label, value, min = 70, max = 130 }: { label: string; value: number; min?: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = value >= 108 ? "#4d7c0f" : "#ca8a04";
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-48 text-[var(--rowi-muted)] truncate">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-right text-[var(--rowi-fg)]">{Math.round(value)}</span>
    </div>
  );
}

function readFile(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read_error"));
    r.readAsText(f);
  });
}

export default function ConsultantReportPage() {
  const { t } = useI18n();
  const [seiFile, setSeiFile] = useState<File | null>(null);
  const [vsFile, setVsFile] = useState<File | null>(null);
  const [scope, setScope] = useState<"LVS" | "TVS" | "OVS">("TVS");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [view, setView] = useState<"report" | "confidential">("report");
  const [exporting, setExporting] = useState<"client" | "confidential" | null>(null);

  async function exportPptx(kind: "client" | "confidential") {
    if (!report || exporting) return;
    setExporting(kind);
    try {
      if (kind === "client") await exportClientPptx(report);
      else await exportConfidentialPptx(report);
    } catch {
      setError("pptx_error");
    } finally {
      setExporting(null);
    }
  }

  async function generate() {
    if (!seiFile) {
      setError(t("consultant.report.needSei", "Sube primero el CSV del SEI."));
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const seiCsv = await readFile(seiFile);
      const vsCsv = vsFile ? await readFile(vsFile) : "";
      const res = await fetch("/api/consultant/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seiCsv, vsCsv, scope, subjectLabel: subjectLabel || undefined }),
      }).then((r) => r.json());
      if (res?.ok) setReport(res.report);
      else setError(res?.error || "error");
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--rowi-fg)]">
          {t("consultant.report.title", "Informe SEI ↔ Vital Signs")}
        </h1>
        <p className="text-sm text-[var(--rowi-muted)] mt-1">
          {t("consultant.report.subtitle", "Sube el SEI y el Vital Signs (LVS/TVS/OVS). El agente cruza la capacidad real con la autopercepción y entrega el informe. TVS/OVS es agregado y anónimo; LVS es del líder.")}
        </p>
      </div>

      {/* Paso 1 + 2 */}
      <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-1">
            1 · {t("consultant.report.sei", "SEI (CSV)")}
          </label>
          <input type="file" accept=".csv" onChange={(e) => setSeiFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-1">
            2 · {t("consultant.report.vs", "Vital Signs (CSV)")}
          </label>
          <div className="flex items-center gap-3">
            <input type="file" accept=".csv" onChange={(e) => setVsFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <select value={scope} onChange={(e) => setScope(e.target.value as "LVS" | "TVS" | "OVS")} className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)]">
              <option value="LVS">LVS (líder)</option>
              <option value="TVS">TVS (equipo)</option>
              <option value="OVS">OVS (organización)</option>
            </select>
          </div>
          <p className="text-xs text-[var(--rowi-muted)] mt-1">
            {t("consultant.report.vsOptional", "Opcional: si no subes VS, se infiere desde el SEI (marcado como inferido).")}
          </p>
        </div>
        <input
          value={subjectLabel}
          onChange={(e) => setSubjectLabel(e.target.value)}
          placeholder={t("consultant.report.label", "Nombre del equipo o líder (para el informe)")}
          className="w-full rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm text-[var(--rowi-fg)]"
        />
        <button onClick={generate} disabled={loading} className="rowi-btn-primary px-6 py-2">
          {loading ? t("consultant.report.running", "Analizando…") : t("consultant.report.run", "Generar informe")}
        </button>
        {error && <p className="text-rose-600 text-sm">{t("consultant.report.error", "No se pudo generar")}: {error}</p>}
      </div>

      {/* Selector de entregable: informe (cliente) vs guía confidencial (partner) */}
      {report && (
        <div className="flex gap-2">
          <button
            onClick={() => setView("report")}
            className={`text-sm rounded-lg px-4 py-2 ${view === "report" ? "rowi-btn-primary" : "border border-[var(--rowi-card-border)] text-[var(--rowi-fg)]"}`}
          >
            📊 {t("consultant.report.viewReport", "Informe")}
          </button>
          <button
            onClick={() => setView("confidential")}
            className={`text-sm rounded-lg px-4 py-2 ${view === "confidential" ? "rowi-btn-primary" : "border border-[var(--rowi-card-border)] text-[var(--rowi-fg)]"}`}
          >
            🔒 {t("consultant.report.viewConfidential", "Guía confidencial")}
          </button>
        </div>
      )}

      {/* GUÍA CONFIDENCIAL DEL PARTNER (espejo del PDF confidencial de Bancolombia) */}
      {report && view === "confidential" && (
        <div id="rowi-confidential" className="rounded-2xl border border-amber-300 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/10 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Confidencial · solo para el partner facilitador
              </p>
              <h2 className="text-xl font-bold text-[var(--rowi-fg)]">{report.subjectLabel} — Guía de lectura e intervención</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="text-sm rounded-lg border border-[var(--rowi-card-border)] px-3 py-1.5 text-[var(--rowi-fg)]">
                {t("consultant.report.print", "Imprimir / PDF")}
              </button>
              <button
                onClick={() => exportPptx("confidential")}
                disabled={exporting !== null}
                className="text-sm rounded-lg border border-amber-300 dark:border-amber-900/40 px-3 py-1.5 text-amber-700 dark:text-amber-400 disabled:opacity-50"
              >
                {exporting === "confidential"
                  ? t("consultant.report.exportingPptx", "Generando PPTX…")
                  : t("consultant.report.pptxConfidential", "PPTX confidencial (partner)")}
              </button>
            </div>
          </div>

          <p className="text-sm text-[var(--rowi-muted)]">
            Este documento contiene lecturas individuales que NO deben compartirse con el cliente ni
            incluirse en la propuesta oficial. La data personal pertenece a cada persona; aquí se usa
            solo para diseñar una conversación cuidadosa.
          </p>

          <section>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Lecturas individuales (motor)</h3>
            <InsightList items={report.insights?.partner ?? []} />
          </section>

          <section>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Cómo entrar (guion)</h3>
            <ul className="space-y-1 text-sm text-[var(--rowi-fg)]">
              <li>· El SEI es un espejo, no un veredicto. No defender el reporte.</li>
              <li>· Empezar por lo que se fortaleció antes de explorar lo que se enfrió.</li>
              <li>· Una emoción por vez. Curiosidad antes que juicio.</li>
              <li>· Ante señales de bienestar (marcadas arriba): acompañar, no diagnosticar.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">¿Tocar el SEI o no?</h3>
            <div className="text-sm text-[var(--rowi-fg)] space-y-1">
              <p>· Presentación/propuesta al cliente → <b>No</b>. Solo agregado, nunca perfiles individuales.</p>
              <p>· Debrief de equipo → <b>No a nivel persona</b>. Patrones del grupo, sin señalar.</p>
              <p>· Sesión 1:1 → <b>Sí, con su permiso</b>. Su SEI es de la persona; se trabaja como espejo.</p>
            </div>
          </section>

          <p className="text-xs text-[var(--rowi-muted)] border-t border-amber-200 dark:border-amber-900/40 pt-3">
            Regla raíz: lo agregado es del proyecto; lo individual es de la persona. Si una lectura no
            ayuda a la persona, no se usa.
          </p>
        </div>
      )}

      {/* Entregable (informe de cliente) */}
      {report && view === "report" && (
        <div id="rowi-report" className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--rowi-fg)]">{report.subjectLabel}</h2>
              <p className="text-xs text-[var(--rowi-muted)]">
                {report.vsInstrument} · {report.scope === "cohort" ? "cohorte agregada" : "individual"} ·
                SEI n={report.sei.sampleSize} · VS {report.vsSource === "real" ? "real" : "inferido"}
                {report.vsSampleSize ? ` (n=${report.vsSampleSize})` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="text-sm rounded-lg border border-[var(--rowi-card-border)] px-3 py-1.5 text-[var(--rowi-fg)]">
                {t("consultant.report.print", "Imprimir / PDF")}
              </button>
              <button
                onClick={() => exportPptx("client")}
                disabled={exporting !== null}
                className="text-sm rounded-lg border border-[var(--rowi-card-border)] px-3 py-1.5 text-[var(--rowi-fg)] disabled:opacity-50"
              >
                {exporting === "client"
                  ? t("consultant.report.exportingPptx", "Generando PPTX…")
                  : t("consultant.report.pptxClient", "Exportar PPTX (cliente)")}
              </button>
            </div>
          </div>

          {/* SEI competencias */}
          <section>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">SEI · 8 competencias</h3>
            <div className="space-y-1.5">
              {Object.entries(report.sei.competencies).map(([k, v]) => (
                <Bar key={k} label={SEI_LABEL[k] ?? k} value={v} />
              ))}
            </div>
          </section>

          {/* VS pulse points */}
          {Object.keys(report.pulses).length > 0 && (
            <section>
              <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">
                Vital Signs · pulse points {report.vsSource === "inferred" && <span className="text-xs text-[var(--rowi-muted)]">(inferidos)</span>}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(report.pulses).map(([code, v]) => (
                  <Bar key={code} label={PULSE_LABEL[code] ?? code} value={v as number} min={report.vsInstrument === "LVS" ? 1 : 70} max={report.vsInstrument === "LVS" ? 5 : 130} />
                ))}
              </div>
            </section>
          )}

          {/* Mapa de puntos ciegos */}
          <section>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Cruce SEI ↔ VS · mapa de puntos ciegos</h3>
            <div className="space-y-1">
              {report.blindspotMap.map((r) => (
                <div key={r.pulse} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 dark:bg-zinc-800/50">
                  <span className="text-sm text-[var(--rowi-fg)]">{PULSE_LABEL[r.pulse] ?? r.pulse}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATE_STYLE[r.state]?.cls}`}>
                    {STATE_STYLE[r.state]?.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Dos canastas del blueprint: cliente (agregado) vs partner (confidencial) */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-200 dark:border-green-900/40 p-4">
              <h3 className="font-semibold text-[var(--rowi-fg)] mb-1">📊 Para el cliente (agregado)</h3>
              <p className="text-xs text-[var(--rowi-muted)] mb-2">Insights de equipo — van a la propuesta oficial.</p>
              <InsightList items={report.insights?.client ?? []} />
            </div>
            <div className="rounded-xl border border-amber-300 dark:border-amber-900/40 p-4 bg-amber-50/40 dark:bg-amber-900/10">
              <h3 className="font-semibold text-[var(--rowi-fg)] mb-1">🔒 Confidencial del partner</h3>
              <p className="text-xs text-[var(--rowi-muted)] mb-2">Individual/SEI — NUNCA en material de cliente. Solo en 1:1 con consentimiento.</p>
              <InsightList items={report.insights?.partner ?? []} />
            </div>
          </section>

          {/* Diagnóstico */}
          {report.diagnosis && (
            <section>
              <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Diagnóstico (espejo)</h3>
              <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-4 text-sm text-[var(--rowi-fg)] whitespace-pre-line leading-relaxed">
                {report.diagnosis}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
