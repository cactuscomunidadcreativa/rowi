"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Users,
  Send,
  HeartHandshake,
  RefreshCcw,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminStat,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   📈 CEO Daily Dashboard — la vista diaria del LOOP del negocio.
   Embudo SIA + estado del moat relacional (díadas/ECO/outcome) +
   retención D7/D30. No es el panel de ventas: aquí medimos si el
   loop gira (perfil → brecha → mensaje → outcome → retorno).
========================================================= */

interface CeoData {
  period: string;
  funnel: Array<{ step: string; count: number }>;
  dyads: { total: number; new: number; active: number; withJoinedOther: number };
  eco: {
    sent: number;
    outcomesTotal: number;
    outcomesPositive: number;
    outcomesNegative: number;
    outcomeRate: number;
    workedRate: number;
  };
  retention: {
    cohort7: number;
    returned7: number;
    d7: number;
    cohort30: number;
    returned30: number;
    d30: number;
  };
}

const PERIODS = ["7d", "30d", "90d"] as const;

/** Etiqueta legible de cada paso del embudo (i18n con fallback ES). */
function funnelLabel(step: string, t: (k: string, f?: string) => string): string {
  return t(`admin.ceo.funnel.${step}`, step);
}

export default function CeoDashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<CeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ceo/dashboard?period=${period}`);
      const json = await res.json().catch(() => null);
      if (json?.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cima del embudo para calcular el % de paso de cada escalón.
  const top = data?.funnel?.[0]?.count ?? 0;

  return (
    <AdminPage
      titleKey="admin.ceo.title"
      descriptionKey="admin.ceo.desc"
      icon={Activity}
      loading={loading && !data}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--rowi-border)] overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  period === p
                    ? "bg-[var(--rowi-primary)] text-white"
                    : "bg-[var(--rowi-surface)] text-[var(--rowi-muted)]"
                }`}
              >
                {t(`admin.ceo.period.${p}`, p)}
              </button>
            ))}
          </div>
          <AdminButton variant="secondary" onClick={() => void load()}>
            <RefreshCcw className="w-4 h-4" />
          </AdminButton>
        </div>
      }
    >
      {data && (
        <div className="space-y-4">
          {/* La fila reina: díadas activas, ECOs, outcomes, retorno a 7d */}
          <AdminGrid cols={4}>
            <AdminStat
              label={t("admin.ceo.activeDyads", "Díadas activas")}
              value={data.dyads.active}
              icon={Users}
            />
            <AdminStat
              label={t("admin.ceo.ecosSent", "ECOs enviados")}
              value={data.eco.sent}
              icon={Send}
            />
            <AdminStat
              label={t("admin.ceo.outcomes", "Outcomes cerrados")}
              value={data.eco.outcomesTotal}
              icon={HeartHandshake}
            />
            <AdminStat
              label={t("admin.ceo.d7", "Retención D7")}
              value={`${data.retention.d7}%`}
              icon={TrendingUp}
            />
          </AdminGrid>

          {/* Salud del moat: tasa de outcome capturado + tasa de "funcionó" */}
          <AdminGrid cols={2}>
            <AdminCard titleKey="admin.ceo.moat.title" icon={HeartHandshake}>
              <div className="space-y-3 p-1">
                <Bar
                  label={t("admin.ceo.moat.outcomeRate", "ECOs con outcome capturado")}
                  value={data.eco.outcomeRate}
                  hint={`${data.eco.outcomesTotal}/${data.eco.sent}`}
                />
                <Bar
                  label={t("admin.ceo.moat.workedRate", "Outcomes que funcionaron")}
                  value={data.eco.workedRate}
                  hint={`${data.eco.outcomesPositive}/${data.eco.outcomesTotal}`}
                  positive
                />
                <p className="text-[11px] text-[var(--rowi-muted)] pt-1">
                  {t(
                    "admin.ceo.moat.note",
                    "El outcome es la ground truth que refina la brecha. Sin él, el moat no aprende."
                  )}
                </p>
              </div>
            </AdminCard>

            <AdminCard titleKey="admin.ceo.retention.title" icon={TrendingUp}>
              <div className="space-y-3 p-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t("admin.ceo.retention.d7", "D7")}
                  </span>
                  <span className="font-semibold text-[var(--rowi-foreground)]">
                    {data.retention.d7}% · {data.retention.returned7}/{data.retention.cohort7}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t("admin.ceo.retention.d30", "D30")}
                  </span>
                  <span className="font-semibold text-[var(--rowi-foreground)]">
                    {data.retention.d30}% · {data.retention.returned30}/{data.retention.cohort30}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--rowi-muted)] pt-1">
                  {t(
                    "admin.ceo.retention.note",
                    "Volvieron a cerrar el loop diario (today_completed). Es la señal de retorno más honesta."
                  )}
                </p>
              </div>
            </AdminCard>
          </AdminGrid>

          {/* El embudo SIA paso a paso */}
          <AdminCard titleKey="admin.ceo.funnelTitle" icon={Activity}>
            <div className="space-y-2 p-1">
              {data.funnel.map((row) => {
                const pct = top > 0 ? Math.round((row.count / top) * 100) : 0;
                return (
                  <div key={row.step} className="flex items-center gap-3">
                    <span className="w-48 shrink-0 text-sm text-[var(--rowi-foreground)] truncate">
                      {funnelLabel(row.step, t)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--rowi-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm font-semibold text-[var(--rowi-foreground)]">
                      {row.count}
                    </span>
                    <span className="w-10 text-right text-xs text-[var(--rowi-muted)]">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          {/* Díadas: el inventario de relaciones del negocio */}
          <AdminGrid cols={4}>
            <AdminStat
              label={t("admin.ceo.dyads.total", "Díadas totales")}
              value={data.dyads.total}
              icon={Users}
            />
            <AdminStat
              label={t("admin.ceo.dyads.new", "Nuevas en período")}
              value={data.dyads.new}
              icon={Users}
            />
            <AdminStat
              label={t("admin.ceo.dyads.joined", "Con la otra persona dentro")}
              value={data.dyads.withJoinedOther}
              icon={CheckCircle2}
            />
            <AdminStat
              label={t("admin.ceo.eco.negative", "Outcomes que no funcionaron")}
              value={data.eco.outcomesNegative}
              icon={Activity}
            />
          </AdminGrid>
        </div>
      )}
    </AdminPage>
  );
}

/** Barra de progreso simple para tasas (0-100). */
function Bar({
  label,
  value,
  hint,
  positive = false,
}: {
  label: string;
  value: number;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[var(--rowi-muted)]">{label}</span>
        <span className="font-semibold text-[var(--rowi-foreground)]">
          {value}% {hint && <span className="text-[var(--rowi-muted)] font-normal">· {hint}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--rowi-border)] overflow-hidden">
        <div
          className={`h-full rounded-full ${
            positive
              ? "bg-[var(--rowi-success)]"
              : "bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
