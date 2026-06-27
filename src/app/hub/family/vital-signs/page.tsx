"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import { Heart, Loader2, Users, AlertCircle, UserPlus } from "lucide-react";
import { vsDriverName, type VsLang } from "@/lib/vital-signs/vsLocale";

interface PulsePoint {
  code: string;
  driver: string;
  esName: string;
  enName: string;
  score: number | null;
  band: "low" | "mid" | "high" | "unknown";
}

interface Driver {
  code: string;
  esName: string;
  enName: string;
  score: number | null;
  band: "low" | "mid" | "high" | "unknown";
  pulsePoints: PulsePoint[];
}

interface FamilyMember {
  relationship: string;
  displayName: string;
  consentStatus: string;
  hasData: boolean;
  drivers?: Driver[];
}

interface FVSData {
  ok: boolean;
  user: { name: string; email: string };
  familySize: number;
  acceptedCount: number;
  pendingCount: number;
  self: { drivers: Driver[]; pulsePoints: PulsePoint[] } | null;
  members: FamilyMember[];
  aggregate: Array<{ pulsePointCode: string; mean: number; n: number }>;
}

const RELATIONSHIP_LABELS: Record<string, { es: string; en: string }> = {
  partner: { es: "Pareja", en: "Partner" },
  spouse: { es: "Cónyuge", en: "Spouse" },
  child: { es: "Hijo/a", en: "Child" },
  parent: { es: "Padre/Madre", en: "Parent" },
  sibling: { es: "Hermano/a", en: "Sibling" },
  other: { es: "Otro", en: "Other" },
};

const CONSENT_STATUS: Record<string, { es: string; en: string; color: string }> = {
  accepted: { es: "Aceptado", en: "Accepted", color: "text-emerald-700 dark:text-emerald-300" },
  pending: { es: "Esperando consentimiento", en: "Awaiting consent", color: "text-amber-700 dark:text-amber-300" },
  declined: { es: "Declinó participar", en: "Declined", color: "text-rose-700 dark:text-rose-300" },
  not_required: { es: "No requerido", en: "Not required", color: "text-[var(--rowi-muted)]" },
};

export default function FamilyVitalSignsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FVSData | null>(null);

  // `lang` resuelve los enum-labels locales (relación/consentimiento, solo es/en).
  // `vsLang` resuelve la terminología del catálogo VS (drivers) con pt/it/zh.
  const lang = locale === "en" ? "en" : "es";
  const vsLang = locale as VsLang;

  useEffect(() => {
    fetch("/api/family/vital-signs/me")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((e) => console.error("fvs load error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-[var(--rowi-muted)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("fvs.loading", "Cargando tu vista familiar...")}</span>
        </div>
      </div>
    );
  }

  const noFamily = !data || data.ok === false || data.familySize <= 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-secondary)] to-[var(--rowi-primary)] flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("fvs.title", "Vital Signs de Familia")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("fvs.subtitle", "Cómo se siente vivir en esta familia hoy.")}
          </p>
        </div>
      </div>

      {/* Hypothesis notice */}
      <div className="rowi-card bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-violet-600 dark:text-violet-300 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-violet-900 dark:text-violet-100">
            {t("fvs.hypothesis.notice", "FVS es una extensión Rowi del modelo Vital Signs. Las definiciones están en revisión con Joshua Freedman antes de validación científica formal.")}
          </p>
        </div>
      </div>

      {noFamily ? (
        <div className="rowi-card text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-[var(--rowi-muted-weak)]" />
          <h2 className="text-base font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("fvs.noData", "Aún no hay datos familiares")}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6 max-w-md mx-auto">
            {t("fvs.noDataDesc", "Para empezar, declara las relaciones familiares que quieres incluir.")}
          </p>
          <button onClick={() => router.push("/hub/family")} className="rowi-btn-primary inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {t("fvs.inviteFamily", "Invitar a un familiar")}
          </button>
        </div>
      ) : (
        <>
          {/* Family summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rowi-card">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">
                {t("fvs.familyMembers", "Miembros de la familia")}
              </div>
              <div className="text-2xl font-bold text-[var(--rowi-foreground)]">{data!.familySize}</div>
            </div>
            <div className="rowi-card bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                {t("fvs.consentAccepted", "Aceptado")}
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{data!.acceptedCount}</div>
            </div>
            <div className="rowi-card bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
              <div className="text-xs text-amber-700 dark:text-amber-300 mb-1">
                {t("fvs.consentPending", "Esperando consentimiento")}
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{data!.pendingCount}</div>
            </div>
          </div>

          {/* Self view */}
          {data!.self && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
                {t("fvs.section.self", "Tu lectura individual")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {data!.self.drivers.map((d) => (
                  <div key={d.code} className="rowi-card">
                    <div className="text-xs text-[var(--rowi-muted)] mb-1">
                      {vsDriverName(d.code, vsLang, d.esName, d.enName)}
                    </div>
                    <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                      {d.score?.toFixed(1) ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family members */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("fvs.familyMembers", "Miembros de la familia")}
            </h3>
            <div className="space-y-2">
              {data!.members.map((m, i) => {
                const relLabel = RELATIONSHIP_LABELS[m.relationship];
                const consentLabel = CONSENT_STATUS[m.consentStatus];
                return (
                  <div key={i} className="rowi-card flex items-center justify-between">
                    <div>
                      <div className="text-[var(--rowi-foreground)] font-medium">{m.displayName}</div>
                      <div className="text-xs text-[var(--rowi-muted)]">
                        {relLabel ? (lang === "en" ? relLabel.en : relLabel.es) : m.relationship}
                      </div>
                    </div>
                    <div className={`text-sm ${consentLabel?.color ?? "text-[var(--rowi-muted)]"}`}>
                      {consentLabel ? (lang === "en" ? consentLabel.en : consentLabel.es) : m.consentStatus}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregated family view */}
          {data!.aggregate.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
                {t("fvs.section.family", "Lectura familiar agregada")}
              </h3>
              <div className="rowi-card">
                <p className="text-xs text-[var(--rowi-muted)] mb-3">
                  {t("familyVs.aggregate.averageOver", "Promedio sobre")} {data!.acceptedCount + 1}{" "}
                  {data!.acceptedCount === 0
                    ? t("familyVs.aggregate.personSingular", "persona")
                    : t("familyVs.aggregate.personPlural", "personas")}{" "}
                  {t("familyVs.aggregate.withDataAvailable", "con datos disponibles")}
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {data!.aggregate.slice(0, 15).map((agg) => {
                    const ppKey = `vs.pp.${agg.pulsePointCode.split("_").slice(1).join("_").toLowerCase()}`;
                    return (
                      <div
                        key={agg.pulsePointCode}
                        className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                      >
                        <div className="text-xs text-[var(--rowi-muted)] mb-1">
                          {t(ppKey, agg.pulsePointCode)}
                        </div>
                        <div className="text-base font-semibold text-[var(--rowi-foreground)]">
                          {agg.mean.toFixed(1)}
                        </div>
                        <div className="text-xs text-[var(--rowi-muted-weak)]">n={agg.n}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
