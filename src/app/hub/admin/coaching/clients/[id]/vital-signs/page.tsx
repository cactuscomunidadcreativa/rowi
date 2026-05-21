"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import { Heart, Loader2, ShieldAlert, UserCircle2 } from "lucide-react";

interface Driver {
  code: string;
  esName: string;
  enName: string;
  score: number | null;
  band: "low" | "mid" | "high" | "unknown";
  pulsePoints: Array<{
    code: string;
    esName: string;
    enName: string;
    esFunction: string;
    enFunction: string;
    score: number | null;
    band: "low" | "mid" | "high" | "unknown";
  }>;
}

interface CoachVSData {
  ok: boolean;
  error?: string;
  client?: { id: string; name: string | null; email: string };
  accessVia?: "service_engagement" | "personal_invite";
  source?: "inferred" | "no-snapshot";
  drivers?: Driver[];
  quadrant?: { code: string; esName: string; enName: string };
}

export default function CoachClientVSPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const [data, setData] = useState<CoachVSData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      // First try the id as a User.id directly. If the coach endpoint returns
      // not_found, treat the id as a ClientAccess.id and resolve via the
      // admin resolver — that's the path used from the coaching/clients table.
      let res = await fetch(`/api/coach/client-vs?clientUserId=${id}`).then((r) => r.json());
      if (!cancelled && res?.ok === false) {
        const resolved = await fetch(`/api/admin/coaching/clients/${id}/resolve`).then((r) => r.json());
        if (resolved?.ok && resolved.clientUserId) {
          res = await fetch(`/api/coach/client-vs?clientUserId=${resolved.clientUserId}`).then((r) => r.json());
        }
      }
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
        <div className="rowi-card bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-300 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("coach.vs.noAccess", "Sin acceso a este cliente")}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {data?.error ?? t("coach.vs.noAccessDesc", "Necesitas un ServiceEngagement activo o una invitación personal aceptada del cliente.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-secondary)] to-[var(--rowi-primary)] flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {data.client?.name ?? data.client?.email}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)] flex items-center gap-2">
            <UserCircle2 className="w-3 h-3" />
            {data.accessVia === "service_engagement"
              ? t("coach.vs.viaEngagement", "Acceso vía ServiceEngagement activo")
              : t("coach.vs.viaInvite", "Acceso vía invitación personal aceptada")}
          </p>
        </div>
      </div>

      {data.source === "no-snapshot" ? (
        <div className="rowi-card text-center py-8">
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("coach.vs.noSnapshot", "Este cliente aún no tiene SEI Assessment vinculado.")}
          </p>
        </div>
      ) : (
        <>
          {/* Quadrant */}
          {data.quadrant && (
            <div className="rowi-card">
              <div className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide mb-1">
                {t("vs.section.quadrant", "Cuadrante dominante")}
              </div>
              <div className="text-3xl font-bold rowi-gradient-text">
                {lang === "en" ? data.quadrant.enName : data.quadrant.esName}
              </div>
            </div>
          )}

          {/* Drivers */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data.drivers ?? []).map((d) => (
              <div key={d.code} className="rowi-card">
                <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide mb-1">
                  {lang === "en" ? d.enName : d.esName}
                </div>
                <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                  {d.score?.toFixed(1) ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Pulse Points */}
          <div className="space-y-3">
            {(data.drivers ?? []).map((d) => (
              <div key={d.code} className="rowi-card">
                <div className="text-sm font-medium text-[var(--rowi-foreground)] mb-3">
                  {lang === "en" ? d.enName : d.esName}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {d.pulsePoints.map((pp) => (
                    <div
                      key={pp.code}
                      className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                          {lang === "en" ? pp.enName : pp.esName}
                        </span>
                        <span className="text-base font-semibold text-[var(--rowi-foreground)]">
                          {pp.score?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)] line-clamp-1">
                        {lang === "en" ? pp.enFunction : pp.esFunction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
