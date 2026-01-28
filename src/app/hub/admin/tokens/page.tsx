"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Gauge,
  RefreshCcw,
  Cpu,
  Coins,
  Building2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminEmpty,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Rowi Admin — Token Usage Dashboard
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface UsageData {
  tenant?: { name: string };
  tenantId: string;
  feature: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  calls: number;
  costUsd: number;
}

interface GroupedUsage {
  tenant: string;
  feature: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  calls: number;
  costUsd: number;
}

export default function TokensPage() {
  const { t, ready } = useI18n();
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsage() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/usage/list");
      const data = await res.json();
      setUsage(data || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadUsage();
  }, [ready]);

  // Group by tenant + feature
  const grouped = usage.reduce((acc: Record<string, GroupedUsage>, u) => {
    const key = `${u.tenant?.name || u.tenantId}-${u.feature}`;
    if (!acc[key]) {
      acc[key] = {
        tenant: u.tenant?.name || u.tenantId,
        feature: u.feature,
        model: u.model,
        tokensInput: 0,
        tokensOutput: 0,
        calls: 0,
        costUsd: 0,
      };
    }
    acc[key].tokensInput += u.tokensInput || 0;
    acc[key].tokensOutput += u.tokensOutput || 0;
    acc[key].calls += u.calls || 0;
    acc[key].costUsd += Number(u.costUsd || 0);
    return acc;
  }, {});

  const rows = Object.values(grouped);

  // Calculate totals
  const totals = rows.reduce(
    (acc, r) => ({
      tokensInput: acc.tokensInput + r.tokensInput,
      tokensOutput: acc.tokensOutput + r.tokensOutput,
      calls: acc.calls + r.calls,
      costUsd: acc.costUsd + r.costUsd,
    }),
    { tokensInput: 0, tokensOutput: 0, calls: 0, costUsd: 0 }
  );

  return (
    <AdminPage
      titleKey="admin.tokens.title"
      descriptionKey="admin.tokens.description"
      icon={Gauge}
      loading={loading}
      actions={
        <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadUsage} size="sm">
          {t("admin.common.refresh")}
        </AdminButton>
      }
    >
      {/* Summary Cards */}
      <AdminGrid cols={4} className="mb-6">
        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.tokens.totalCalls")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {totals.calls.toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.tokens.tokensIn")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {totals.tokensInput.toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.tokens.tokensOut")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {totals.tokensOutput.toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.tokens.totalCost")}</p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                ${totals.costUsd.toFixed(4)}
              </p>
            </div>
          </div>
        </AdminCard>
      </AdminGrid>

      {/* Usage Table */}
      {rows.length === 0 ? (
        <AdminEmpty
          icon={Gauge}
          titleKey="admin.tokens.noUsage"
          descriptionKey="admin.tokens.description"
        />
      ) : (
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.tokens.tenant")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.tokens.agent")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.tokens.calls")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.tokens.tokensIn")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.tokens.tokensOut")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    USD
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--rowi-border)] hover:bg-[var(--rowi-primary)]/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[var(--rowi-muted)]" />
                        <span className="text-[var(--rowi-foreground)]">{r.tenant}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[var(--rowi-muted)]" />
                        <span className="text-[var(--rowi-foreground)]">{r.feature}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">
                      {r.calls.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">
                      {r.tokensInput.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">
                      {r.tokensOutput.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminBadge variant="warning">
                        ${r.costUsd.toFixed(4)}
                      </AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--rowi-primary)]/5">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.tokens.total")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--rowi-foreground)]">
                    {totals.calls.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--rowi-foreground)]">
                    {totals.tokensInput.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--rowi-foreground)]">
                    {totals.tokensOutput.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--rowi-primary)]">
                    ${totals.costUsd.toFixed(4)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
