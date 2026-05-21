"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ThumbsUp,
  Eye,
  X as XIcon,
  Target,
  Flag,
} from "lucide-react";

type Verdict = "OWN" | "CONSIDER" | "REJECT";

interface Score {
  dimension: string;
  level: string;
  scoreMean: number;
  scoreSD: number | null;
  n: number;
}

interface Commitment {
  id: string;
  description: string;
  pulsePointCode: string | null;
  importance: number | null;
  clarity: number | null;
  believability: number | null;
  status: string;
}

interface Session {
  id: string;
  scope: string;
  step: number;
  status: string;
  notes: string | null;
  scheduledAt: string;
  assessment: { id: string; scope: string; sampleSize: number; scores: Score[] };
  commitments: Commitment[];
}

interface Feedback {
  pulsePointCode: string;
  verdict: Verdict;
}

const STEP_LABELS: Array<{ es: string; en: string; icon: typeof Flag }> = [
  { es: "Contexto", en: "Set the Context", icon: Flag },
  { es: "Overview", en: "Overview", icon: Eye },
  { es: "Orientación", en: "Orientation", icon: Target },
  { es: "Engagement & Scores", en: "Engagement & Scores", icon: ThumbsUp },
  { es: "Drivers & Outcomes", en: "Drivers & Outcomes", icon: Target },
  { es: "Pulse Points", en: "Pulse Points", icon: CheckCircle2 },
  { es: "Comparaciones", en: "Comparisons", icon: Eye },
  { es: "Action Plan", en: "Action Plan", icon: Flag },
];

const VERDICT_STYLE: Record<Verdict, { bg: string; label: { es: string; en: string }; icon: typeof ThumbsUp }> = {
  OWN: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    label: { es: "Acepto", en: "Own" },
    icon: ThumbsUp,
  },
  CONSIDER: {
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300",
    label: { es: "Considero", en: "Consider" },
    icon: Eye,
  },
  REJECT: {
    bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300",
    label: { es: "Rechazo", en: "Reject" },
    icon: XIcon,
  },
};

export default function DebriefWizardPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";

  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Map<string, Verdict>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCommitment, setNewCommitment] = useState<{
    description: string;
    pulsePointCode: string;
    importance: number;
    clarity: number;
    believability: number;
  }>({
    description: "",
    pulsePointCode: "",
    importance: 70,
    clarity: 70,
    believability: 70,
  });

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/vital-signs/debrief/${id}`);
      const j = await r.json();
      if (j.ok) {
        setSession(j.session);
        const fb = new Map<string, Verdict>();
        (j.feedbacks ?? []).forEach((f: Feedback) => fb.set(f.pulsePointCode, f.verdict));
        setFeedbacks(fb);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function advanceStep(next: number) {
    if (!session) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/vital-signs/debrief/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: next }),
      });
      const j = await r.json();
      if (j.ok) setSession({ ...session, step: next, status: j.session.status });
    } finally {
      setSaving(false);
    }
  }

  async function recordVerdict(pulsePointCode: string, verdict: Verdict) {
    setFeedbacks(new Map(feedbacks).set(pulsePointCode, verdict));
    await fetch("/api/vital-signs/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pulsePointCode,
        verdict,
        assessmentId: session?.assessment.id,
      }),
    });
  }

  async function addCommitment() {
    if (!session || !newCommitment.description.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/vital-signs/action-commitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debriefId: session.id,
          description: newCommitment.description,
          pulsePointCode: newCommitment.pulsePointCode || undefined,
          importance: newCommitment.importance,
          clarity: newCommitment.clarity,
          believability: newCommitment.believability,
        }),
      });
      const j = await r.json();
      if (j.ok) {
        setSession({ ...session, commitments: [...session.commitments, j.commitment] });
        setNewCommitment({ ...newCommitment, description: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="rowi-card text-center py-8">
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("debrief.notFound", "Sesión no encontrada o sin acceso.")}
          </p>
        </div>
      </div>
    );
  }

  const step = session.step;
  const stepData = STEP_LABELS[step] ?? STEP_LABELS[0];
  const drivers = session.assessment.scores.filter((s) => s.level === "driver");
  const outcomes = session.assessment.scores.filter((s) => s.level === "outcome");

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header + progress */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
              {t("debrief.title", "Debrief")} {session.scope}
            </h1>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("debrief.step", "Paso")} {step + 1} / 8 · {lang === "en" ? stepData.en : stepData.es}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step
                  ? "bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                  : "bg-[var(--rowi-card-border)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rowi-card">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {t("debrief.s0.title", "Establecer contexto")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("debrief.s0.body", "Revisa el Why/What/Who/How del Engage. ¿Por qué nos reunimos? ¿Cuál es el alcance? ¿Qué esperamos lograr?")}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {t("debrief.s1.title", "Overview del reporte")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("debrief.s1.body", "¿Cómo se siente el clima en esta organización? Como el clima físico, ¿se entra esperando lluvia o esperando buen tiempo?")}
            </p>
            <div className="text-xs text-[var(--rowi-muted-weak)]">
              N = {session.assessment.sampleSize} respondentes
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {t("debrief.s2.title", "Orientación")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("debrief.s2.body", "Analiza el estilo del equipo / organización (cuadrante Linterna · Mapa · Botiquín · Botas) en relación con sus objetivos.")}
            </p>
          </div>
        )}

        {(step === 3 || step === 4) && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {step === 3
                ? t("debrief.s3.title", "Engagement & scores")
                : t("debrief.s4.title", "Drivers & outcomes")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {drivers.map((d) => (
                <div
                  key={d.dimension}
                  className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                >
                  <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide">
                    {d.dimension}
                  </div>
                  <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    {d.scoreMean.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--rowi-muted)]">
                    SD={d.scoreSD?.toFixed(1) ?? "—"}
                  </div>
                </div>
              ))}
            </div>
            {step === 4 && outcomes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3">
                {outcomes.map((o) => (
                  <div
                    key={o.dimension}
                    className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                  >
                    <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide">
                      {o.dimension}
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {o.scoreMean.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--rowi-foreground)] mb-1">
                {t("debrief.s5.title", "Pulse Points · 3 highlighters")}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("debrief.s5.body", "Por cada driver, marca tu lectura: lo asumes (OWN), lo estás considerando (CONSIDER), o lo rechazas (REJECT). Esto valida o refina la hipótesis BE2GROW.")}
              </p>
            </div>
            <div className="space-y-2">
              {drivers.map((d) => {
                const code = `DRIVER_${d.dimension}`;
                const current = feedbacks.get(code);
                return (
                  <div
                    key={d.dimension}
                    className="rowi-card flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--rowi-foreground)]">
                        {d.dimension}
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)]">
                        {t("debrief.score", "Score")} {d.scoreMean.toFixed(1)} · SD {d.scoreSD?.toFixed(1) ?? "—"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(["OWN", "CONSIDER", "REJECT"] as Verdict[]).map((v) => {
                        const VStyle = VERDICT_STYLE[v];
                        const VIcon = VStyle.icon;
                        const active = current === v;
                        return (
                          <button
                            key={v}
                            onClick={() => recordVerdict(code, v)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center gap-1 transition-colors ${
                              active
                                ? VStyle.bg
                                : "border-[var(--rowi-card-border)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-card-elev)]"
                            }`}
                          >
                            <VIcon className="w-3 h-3" />
                            {lang === "en" ? VStyle.label.en : VStyle.label.es}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {t("debrief.s6.title", "Comparaciones y preguntas adicionales")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("debrief.s6.body", "Explora subgrupos. ¿Hay áreas donde los scores difieren significativamente? ¿Qué dice eso del sistema?")}
            </p>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--rowi-foreground)]">
              {t("debrief.s7.title", "Action plan · Expectancy Theory")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("debrief.s7.body", "Compromisos concretos. Por cada acción, califica importancia, claridad de ruta, y creencia de poder lograrlo.")}
            </p>

            {/* Existing commitments */}
            {session.commitments.length > 0 && (
              <div className="space-y-2">
                {session.commitments.map((c) => (
                  <div key={c.id} className="rowi-card">
                    <div className="text-sm text-[var(--rowi-foreground)]">{c.description}</div>
                    {c.pulsePointCode && (
                      <div className="text-xs text-[var(--rowi-muted)] mt-1">
                        {c.pulsePointCode}
                      </div>
                    )}
                    <div className="text-xs text-[var(--rowi-muted-weak)] mt-2 flex gap-4">
                      <span>Importance {c.importance ?? "—"}</span>
                      <span>Clarity {c.clarity ?? "—"}</span>
                      <span>Believability {c.believability ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New commitment form */}
            <div className="rowi-card space-y-3 bg-[var(--rowi-card-elev)]">
              <input
                type="text"
                placeholder={t("debrief.s7.placeholder", "Describe el compromiso (qué vas a hacer)...")}
                value={newCommitment.description}
                onChange={(e) => setNewCommitment({ ...newCommitment, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] text-sm text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)]"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  { key: "importance", label: { es: "Importancia", en: "Importance" } },
                  { key: "clarity", label: { es: "Claridad", en: "Clarity" } },
                  { key: "believability", label: { es: "Creencia", en: "Believability" } },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-[var(--rowi-muted)] mb-1">
                      {lang === "en" ? f.label.en : f.label.es}: {newCommitment[f.key]}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newCommitment[f.key]}
                      onChange={(e) =>
                        setNewCommitment({ ...newCommitment, [f.key]: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addCommitment}
                disabled={saving || !newCommitment.description.trim()}
                className="rowi-btn-primary disabled:opacity-50"
              >
                {t("debrief.s7.add", "Agregar compromiso")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => advanceStep(Math.max(0, step - 1))}
          disabled={step === 0 || saving}
          className="rowi-btn inline-flex items-center gap-1 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("debrief.prev", "Anterior")}
        </button>

        {session.status === "completed" ? (
          <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {t("debrief.completed", "Completado")}
          </span>
        ) : (
          <button
            onClick={() => advanceStep(Math.min(7, step + 1))}
            disabled={step >= 7 || saving}
            className="rowi-btn-primary inline-flex items-center gap-1 disabled:opacity-40"
          >
            {step === 7 ? t("debrief.finish", "Cerrar debrief") : t("debrief.next", "Siguiente")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
