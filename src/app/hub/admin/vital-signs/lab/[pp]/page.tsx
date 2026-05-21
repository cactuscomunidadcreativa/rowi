"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface WeightRow {
  id: string;
  pulsePointCode: string;
  version: number;
  predictor: string;
  weight: number;
  active: boolean;
  notes: string | null;
}

const SEI_PREDICTORS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const BT_PREDICTORS = [
  "dataMining", "modeling", "prioritizing",
  "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking",
  "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving",
  "vision", "designing", "entrepreneurship",
];
const GROUP_PREDICTORS = [
  "grp:focus_data", "grp:focus_people",
  "grp:decisions_evaluative", "grp:decisions_innovative",
  "grp:drive_practical", "grp:drive_idealistic",
];

const ALL_PREDICTORS = [...SEI_PREDICTORS, ...BT_PREDICTORS, ...GROUP_PREDICTORS];

export default function VsLabDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ pp: string }>();
  const pp = (params?.pp as string) ?? "";

  const [versionMap, setVersionMap] = useState<Record<number, WeightRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vital-signs/weights?pp=${pp}`);
      const data = await res.json();
      if (data?.ok) {
        const byVersion = (data.weights?.[pp] ?? {}) as Record<number, WeightRow[]>;
        setVersionMap(byVersion);
        const versions = Object.keys(byVersion).map(Number);
        if (versions.length > 0) {
          const active = versions.find((v) => byVersion[v].some((r) => r.active));
          setSelectedVersion(active ?? Math.max(...versions));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pp) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pp]);

  const rows = selectedVersion !== null ? versionMap[selectedVersion] ?? [] : [];
  const isActiveVersion =
    selectedVersion !== null && rows.length > 0 && rows.some((r) => r.active);

  const weightsByPredictor = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.predictor] = r.weight;
    return m;
  }, [rows]);

  async function saveWeight(predictor: string) {
    if (selectedVersion === null) return;
    const value = edits[predictor];
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/vital-signs/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pulsePointCode: pp,
          version: selectedVersion,
          predictor,
          weight: value,
        }),
      });
      const j = await res.json();
      if (j?.ok === false) {
        setMessage(j.error ?? "save_failed");
        return;
      }
      const next = { ...edits };
      delete next[predictor];
      setEdits(next);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function activateVersion() {
    if (selectedVersion === null) return;
    if (!confirm(t("vsLab.confirmActivate", "¿Activar esta versión? La anterior dejará de usarse."))) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/vital-signs/weights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pulsePointCode: pp, version: selectedVersion, active: true }),
      });
      const j = await res.json();
      if (j?.ok === false) {
        setMessage(j.error ?? "activate_failed");
        return;
      }
      setMessage(t("vsLab.activated", "Versión activada."));
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const versions = Object.keys(versionMap).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/hub/admin/vital-signs/lab"
          className="inline-flex items-center gap-1 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("vsLab.back", "Volver al lab")}
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">{pp}</h1>
        <p className="text-sm text-[var(--rowi-muted)] mt-1">
          {t(
            "vsLab.detailDescription",
            "Pesos por predictor para este pulse point. v0 hipótesis es la matriz BE2GROW hardcoded; v1+ son versiones calibradas desde benchmarks. Solo una versión puede estar activa.",
          )}
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="rowi-card text-center py-8 text-sm text-[var(--rowi-muted)]">
          {t(
            "vsLab.empty",
            "No hay versiones calibradas todavía. Corre /api/admin/vital-signs/weights/recalculate?benchmarkId=… para generar v1.",
          )}
        </div>
      ) : (
        <>
          <div className="rowi-card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-[var(--rowi-muted)]">{t("vsLab.version", "Versión")}</label>
                <select
                  value={selectedVersion ?? ""}
                  onChange={(e) => setSelectedVersion(Number(e.target.value))}
                  className="rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-sm h-8 px-2"
                >
                  {versions.map((v) => (
                    <option key={v} value={v}>
                      v{v}
                      {versionMap[v].some((r) => r.active) ? " ✓ activa" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {isActiveVersion ? (
                  <span className="rowi-chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Check className="w-3 h-3 inline mr-1" />
                    {t("vsLab.isActive", "Esta versión está activa")}
                  </span>
                ) : (
                  <button
                    onClick={activateVersion}
                    disabled={saving}
                    className="rowi-btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    {t("vsLab.activate", "Activar esta versión")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rowi-card">
            <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("vsLab.predictors", "Predictores")} ({rows.length}/32)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--rowi-muted)] uppercase tracking-wider border-b border-[var(--rowi-card-border)]">
                    <th className="py-2 pr-3">{t("vsLab.predictor", "Predictor")}</th>
                    <th className="py-2 pr-3">{t("vsLab.weight", "Peso")}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_PREDICTORS.map((p) => {
                    const current = weightsByPredictor[p];
                    const edit = edits[p];
                    return (
                      <tr key={p} className="border-b border-[var(--rowi-card-border)]/40">
                        <td className="py-2 pr-3 font-mono text-xs text-[var(--rowi-foreground)]">{p}</td>
                        <td className="py-2 pr-3">
                          {current !== undefined ? (
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={current.toFixed(3)}
                              onChange={(e) =>
                                setEdits({ ...edits, [p]: Number(e.target.value) })
                              }
                              className="w-24 rounded border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] h-7 px-2 text-sm font-mono"
                            />
                          ) : (
                            <span className="text-xs text-[var(--rowi-muted-weak)]">
                              {t("vsLab.notPresent", "—")}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {edit !== undefined && edit !== current && (
                            <button
                              onClick={() => saveWeight(p)}
                              disabled={saving}
                              className="rowi-btn-primary text-[10px] inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Save className="w-3 h-3" />
                              {t("vsLab.save", "Salvar")}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {message && (
              <p className="text-xs text-[var(--rowi-muted)] mt-2">{message}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
