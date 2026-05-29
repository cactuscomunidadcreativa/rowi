import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function periodToMonths(period: string): number {
  switch (period) {
    case "1m": return 1;
    case "3m": return 3;
    case "1y": return 12;
    default: return 6;
  }
}

/**
 * Finance dashboard — real KPIs aggregated from the Transaction model
 * (income vs expense by month). No fabricated numbers: when there are no
 * transactions, metrics/monthlyData come back empty and the UI shows an
 * empty state.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const months = periodToMonths(url.searchParams.get("period") || "6m");

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const where: Record<string, unknown> = { date: { gte: start } };
    if (auth.scope.type === "hub") where.hubId = auth.scope.id;
    else if (auth.scope.type === "tenant") where.tenantId = auth.scope.id;

    const txns = await prisma.transaction.findMany({
      where,
      select: { type: true, amountUsd: true, date: true },
      orderBy: { date: "asc" },
    });

    // Bucket by year-month.
    const buckets = new Map<string, { income: number; expenses: number; label: string }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, { income: 0, expenses: 0, label: MONTHS_ES[d.getMonth()] });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of txns) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.get(key);
      const amount = Number(t.amountUsd);
      if (t.type === "INCOME") {
        totalIncome += amount;
        if (bucket) bucket.income += amount;
      } else if (t.type === "EXPENSE") {
        totalExpenses += amount;
        if (bucket) bucket.expenses += amount;
      }
    }

    const monthlyData = Array.from(buckets.values()).map((b) => ({
      month: b.label,
      income: Math.round(b.income),
      expenses: Math.round(b.expenses),
      profit: Math.round(b.income - b.expenses),
    }));

    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Only emit metrics when there is real data; otherwise empty → empty state.
    const metrics = txns.length === 0
      ? []
      : [
          { label: "Ingresos Totales", value: Math.round(totalIncome), change: 0, trend: "up" as const, prefix: "$" },
          { label: "Gastos Totales", value: Math.round(totalExpenses), change: 0, trend: "up" as const, prefix: "$" },
          { label: "Beneficio Neto", value: Math.round(netProfit), change: 0, trend: netProfit >= 0 ? ("up" as const) : ("down" as const), prefix: "$" },
          { label: "Margen de Beneficio", value: Math.round(margin * 10) / 10, change: 0, trend: "up" as const, suffix: "%" },
        ];

    return NextResponse.json({
      ok: true,
      metrics,
      monthlyData: txns.length === 0 ? [] : monthlyData,
    });
  } catch (e) {
    console.error("[finance/dashboard] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
