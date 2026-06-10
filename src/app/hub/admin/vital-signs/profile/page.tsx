"use client";

/**
 * Rowi Consultor — Perfil integral (cruce SEI ↔ Vital Signs).
 *
 * Subes/pegas el SEI (8 competencias) + el VS (pulse points) de una persona o
 * cohorte y el agente devuelve el mapa de PUNTOS CIEGOS + un diagnóstico-espejo.
 * Modelo de salida: el perfil de Carolina Navarro.
 *
 * Llama a POST /api/consultant/profile (admin con scope). El motor y la
 * narrativa viven en el backend; esta página solo recoge input y pinta el
 * resultado.
 */
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const SEI_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
const SEI_LABEL: Record<string, string> = {
  EL: "Alfabetización Emocional", RP: "Reconocer Patrones", ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones", IM: "Motivación Intrínseca", OP: "Optimismo",
  EMP: "Empatía", NG: "Metas Nobles",
};

// pulse code → etiqueta ES (del catálogo)
const PULSES: Array<{ code: string; label: string }> = [
  { code: "TRUST_TRANSPARENCY", label: "Transparencia" },
  { code: "TRUST_COHERENCE", label: "Coherencia" },
  { code: "TRUST_CARE", label: "Cuidado" },
  { code: "MOTIVATION_MEANING", label: "Significado" },
  { code: "MOTIVATION_MASTERY", label: "Maestría" },
  { code: "MOTIVATION_AUTONOMY", label: "Autonomía" },
  { code: "CHANGE_IMAGINATION", label: "Imaginación" },
  { code: "CHANGE_EXPLORATION", label: "Exploración" },
  { code: "CHANGE_CELEBRATION", label: "Celebración" },
  { code: "TEAMWORK_DIVERGENCE", label: "Divergencia" },
  { code: "TEAMWORK_CONNECTION", label: "Conexión" },
  { code: "TEAMWORK_JOY", label: "Alegría" },
  { code: "EXECUTION_ACCOUNTABILITY", label: "Responsabilidad" },
  { code: "EXECUTION_FEEDBACK", label: "Feedback" },
  { code: "EXECUTION_FOCUS", label: "Enfoque" },
];

interface BlindspotRow {
  pulse: string;
  selfZ: number;
  capacityZ: number;
  state: "alineado" | "punto_ciego" | "oculto" | "neutral";
}
interface ProfileResult {
  subjectLabel: string;
  scope: string;
  vsInstrument: string;
  blindspotMap: BlindspotRow[];
  diagnosis: string | null;
}

const STATE_STYLE: Record<string, { label: string; cls: string }> = {
  alineado: { label: "Alineado", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  punto_ciego: { label: "Punto ciego", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  oculto: { label: "Oculto", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  neutral: { label: "Neutral", cls: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400" },
};

export default function ConsultantProfilePage() {
  const { t } = useI18n();
  const [subjectLabel, setSubjectLabel] = useState("");
  const [scope, setScope] = useState<"individual" | "cohort">("individual");
  const [vsInstrument, setVsInstrument] = useState<"LVS" | "TVS" | "OVS">("LVS");
  const [comp, setComp] = useState<Record<string, string>>({});
  const [pulses, setPulses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pulseLabel = (code: string) => PULSES.find((p) => p.code === code)?.label ?? code;

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const competencies = Object.fromEntries(
        Object.entries(comp).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)),
      );
      const pulsesNum = Object.fromEntries(
        Object.entries(pulses).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)),
      );
      const res = await fetch("/api/consultant/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectLabel: subjectLabel || (scope === "cohort" ? "Cohorte" : "Sujeto"),
          scope,
          vsInstrument,
          competencies,
          pulses: pulsesNum,
          locale: "es",
        }),
      }).then((r) => r.json());
      if (res?.ok) setResult(res.profile);
      else setError(res?.error || "error");
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--rowi-fg)]">
          {t("consultant.profile.title", "Perfil integral · SEI ↔ Vital Signs")}
        </h1>
        <p className="text-sm text-[var(--rowi-muted)] mt-1">
          {t(
            "consultant.profile.subtitle",
            "Cruza la capacidad real (SEI) con la autopercepción (VS) y revela el mapa de puntos ciegos. No predice clima — es una lectura de autoconciencia.",
          )}
        </p>
      </div>

      {/* Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm text-[var(--rowi-fg)]"
          placeholder={t("consultant.profile.subject", "Nombre del sujeto / cohorte")}
          value={subjectLabel}
          onChange={(e) => setSubjectLabel(e.target.value)}
        />
        <select className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm text-[var(--rowi-fg)]" value={scope} onChange={(e) => setScope(e.target.value as "individual" | "cohort")}>
          <option value="individual">{t("consultant.profile.individual", "Individuo")}</option>
          <option value="cohort">{t("consultant.profile.cohort", "Equipo / cohorte")}</option>
        </select>
        <select className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-sm text-[var(--rowi-fg)]" value={vsInstrument} onChange={(e) => setVsInstrument(e.target.value as "LVS" | "TVS" | "OVS")}>
          <option value="LVS">LVS (liderazgo)</option>
          <option value="TVS">TVS (equipo)</option>
          <option value="OVS">OVS (organización)</option>
        </select>
      </div>

      {/* Inputs SEI + VS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-[var(--rowi-fg)] mb-2">SEI · 8 competencias (70–130)</h2>
          <div className="space-y-2">
            {SEI_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <label className="text-sm w-48 text-[var(--rowi-muted)]">{SEI_LABEL[k]}</label>
                <input
                  type="number" className="w-24 rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)]" min={70} max={130}
                  value={comp[k] ?? ""}
                  onChange={(e) => setComp((c) => ({ ...c, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-[var(--rowi-fg)] mb-2">VS · 15 pulse points</h2>
          <div className="space-y-2">
            {PULSES.map((p) => (
              <div key={p.code} className="flex items-center gap-2">
                <label className="text-sm w-40 text-[var(--rowi-muted)]">{p.label}</label>
                <input
                  type="number" className="w-24 rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)]" step="0.01"
                  value={pulses[p.code] ?? ""}
                  onChange={(e) => setPulses((s) => ({ ...s, [p.code]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={run} disabled={loading} className="rowi-btn-primary px-6 py-2">
        {loading ? t("consultant.profile.running", "Analizando…") : t("consultant.profile.run", "Generar perfil")}
      </button>

      {error && <p className="text-rose-600 text-sm">{t("consultant.profile.error", "No se pudo generar el perfil")}: {error}</p>}

      {/* Resultado */}
      {result && (
        <div className="space-y-5 border-t border-[var(--rowi-card-border)] pt-5">
          <h2 className="text-xl font-bold text-[var(--rowi-fg)]">
            {result.subjectLabel} · {result.vsInstrument}
          </h2>

          <div>
            <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Mapa de puntos ciegos</h3>
            <div className="space-y-1">
              {result.blindspotMap.map((r) => (
                <div key={r.pulse} className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--rowi-card)]">
                  <span className="text-sm text-[var(--rowi-fg)]">{pulseLabel(r.pulse)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATE_STYLE[r.state]?.cls}`}>
                    {STATE_STYLE[r.state]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result.diagnosis && (
            <div>
              <h3 className="font-semibold text-[var(--rowi-fg)] mb-2">Diagnóstico (espejo)</h3>
              <div className="rounded-xl bg-[var(--rowi-card)] p-4 text-sm text-[var(--rowi-fg)] whitespace-pre-line leading-relaxed">
                {result.diagnosis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
