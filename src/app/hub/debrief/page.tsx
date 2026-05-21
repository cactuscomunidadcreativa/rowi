"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Activity, ArrowRight, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface DebriefSession {
  id: string;
  scope: string;
  step: number;
  status: string;
  scheduledAt: string;
  notes: string | null;
  assessment: { id: string; scope: string; sampleSize: number | null; dataset: string | null } | null;
  _count: { commitments: number };
}

interface Assessment {
  id: string;
  scope: string;
  sampleSize: number | null;
  dataset: string | null;
  createdAt: string;
}

export default function DebriefListPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [sessions, setSessions] = useState<DebriefSession[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<DebriefSession["scope"]>("OVS");

  useEffect(() => {
    async function load() {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch("/api/vital-signs/debrief").then((r) => r.json()),
          fetch("/api/vital-signs/assessments").then((r) => r.json()),
        ]);
        if (sRes?.ok) setSessions(sRes.sessions ?? []);
        if (aRes?.ok) {
          const list = aRes.assessments ?? [];
          setAssessments(list);
          if (list.length > 0) setSelectedAssessment(list[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "load_failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function createDebrief() {
    if (!selectedAssessment) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/vital-signs/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: selectedAssessment, scope: selectedScope }),
      });
      const data = await res.json();
      if (data?.ok === false) {
        setError(data.error ?? "create_failed");
        return;
      }
      router.push(`/hub/debrief/${data.session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "create_failed");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">
          {t("debrief.list.title", "Debriefs")}
        </h1>
        <p className="text-sm text-[var(--rowi-muted)]">
          {t(
            "debrief.list.description",
            "Sesiones de debrief sobre tus Vital Signs. Cada debrief incluye highlighting OWN/CONSIDER/REJECT y compromisos de acción.",
          )}
        </p>
      </div>

      {/* CTA crear */}
      <div className="rowi-card">
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
          {t("debrief.list.newTitle", "Iniciar nuevo debrief")}
        </h2>
        {assessments.length === 0 ? (
          <div className="flex items-start gap-2 text-sm text-[var(--rowi-muted)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {t(
                "debrief.list.noAssessments",
                "Todavía no tienes assessments de Vital Signs. Sube un CSV OVS/TVS o pide a tu admin que lo haga para empezar.",
              )}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs text-[var(--rowi-muted)] mb-1">
                  {t("debrief.list.assessment", "Assessment")}
                </span>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-sm h-9 px-2"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.scope} · {a.dataset ?? a.id.slice(0, 8)} ({a.sampleSize ?? "-"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs text-[var(--rowi-muted)] mb-1">
                  {t("debrief.list.scope", "Tipo")}
                </span>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as DebriefSession["scope"])}
                  className="w-full rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-sm h-9 px-2"
                >
                  <option value="OVS">OVS · Individual</option>
                  <option value="TVS">TVS · Equipo</option>
                  <option value="LVS_M1">LVS M1 · Líder (encuentro 1)</option>
                  <option value="LVS_M2">LVS M2 · Líder (encuentro 2)</option>
                  <option value="FVS">FVS · Familia</option>
                </select>
              </label>
            </div>
            <button
              onClick={createDebrief}
              disabled={creating || !selectedAssessment}
              className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("debrief.list.create", "Crear debrief")}
            </button>
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Listado */}
      <div className="rowi-card">
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
          {t("debrief.list.history", "Historial")}
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("debrief.list.empty", "Sin debriefs todavía.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/hub/debrief/${s.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)]/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Activity className="w-4 h-4 text-[var(--rowi-g2)] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                        {s.scope} · {new Date(s.scheduledAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)]">
                        {t("debrief.list.step", "Paso")} {s.step + 1}/7 · {s.status} · {s._count.commitments}{" "}
                        {t("debrief.list.commitments", "compromisos")}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--rowi-muted)] flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
