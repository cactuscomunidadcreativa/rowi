"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { Loader2, ShieldAlert, FileSearch, Clock } from "lucide-react";

interface CaseItem {
  caseCode: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  consentedAt: string | null;
  latestSnapshotAt: string | null;
  inferenceCount: number;
  feedbackCount: number;
}

interface CasesResponse {
  ok: boolean;
  error?: string;
  viewerLevel?: string;
  piiVisible?: boolean;
  cases?: CaseItem[];
  totalConsented?: number;
}

export default function ResearchCasesPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<CasesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research/cases")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="p-6">
        <div className="rowi-card bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-300 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("research.noAccess", "Sin acceso a Research Lens")}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {data?.error ?? t("research.noAccessDesc", "Esta área es solo para roles con researchAccessLevel asignado.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("research.cases.title", "Casos de estudio")}
          </h2>
          <p className="text-xs text-[var(--rowi-muted)]">
            {data.totalConsented} {t("research.cases.consented", "personas con consent research_lens")} ·{" "}
            {t("research.cases.piiMode", "Tu nivel")}: {data.viewerLevel} ·{" "}
            {data.piiVisible
              ? t("research.cases.piiOn", "PII visible")
              : t("research.cases.piiOff", "Solo códigos")}
          </p>
        </div>
      </div>

      {data.cases && data.cases.length > 0 ? (
        <div className="rowi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
              <tr className="border-b border-[var(--rowi-card-border)]">
                <th className="text-left py-2 px-2">{t("research.cases.code", "Código")}</th>
                {data.piiVisible && (
                  <th className="text-left py-2 px-2">{t("research.cases.name", "Nombre")}</th>
                )}
                <th className="text-left py-2 px-2">{t("research.cases.latest", "Snapshot")}</th>
                <th className="text-right py-2 px-2">{t("research.cases.inferences", "Inferencias")}</th>
                <th className="text-right py-2 px-2">{t("research.cases.feedbacks", "Feedbacks")}</th>
                <th className="text-left py-2 px-2">{t("research.cases.consented", "Consent")}</th>
              </tr>
            </thead>
            <tbody>
              {data.cases.map((c) => (
                <tr
                  key={c.caseCode}
                  className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-card-elev)] transition-colors"
                >
                  <td className="py-2 px-2 font-mono text-xs text-[var(--rowi-foreground)]">
                    {c.caseCode}
                  </td>
                  {data.piiVisible && (
                    <td className="py-2 px-2">
                      <div className="text-[var(--rowi-foreground)]">{c.name ?? "—"}</div>
                      <div className="text-xs text-[var(--rowi-muted)]">{c.email ?? "—"}</div>
                    </td>
                  )}
                  <td className="py-2 px-2 text-xs text-[var(--rowi-muted)]">
                    {c.latestSnapshotAt
                      ? new Date(c.latestSnapshotAt).toLocaleDateString(locale)
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--rowi-foreground)]">
                    {c.inferenceCount}
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--rowi-foreground)]">
                    {c.feedbackCount}
                  </td>
                  <td className="py-2 px-2 text-xs text-[var(--rowi-muted-weak)]">
                    {c.consentedAt
                      ? new Date(c.consentedAt).toLocaleDateString(locale)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rowi-card text-center py-12">
          <FileSearch className="w-12 h-12 text-[var(--rowi-muted-weak)] mx-auto mb-3" />
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("research.cases.empty", "Aún no hay usuarios que hayan consentido el research lens.")}
          </p>
        </div>
      )}

      <div className="rowi-card bg-[var(--rowi-card-elev)] flex items-center gap-3">
        <Clock className="w-4 h-4 text-[var(--rowi-muted)]" />
        <p className="text-xs text-[var(--rowi-muted)]">
          {t("research.audit.notice", "Cada acceso a esta página queda registrado en ResearchAccessAudit y es visible al usuario afectado en su portal de privacidad.")}
        </p>
      </div>
    </div>
  );
}
