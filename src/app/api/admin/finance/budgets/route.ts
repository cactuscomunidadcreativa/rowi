import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/** Finance budgets list — backed by the Budget model, mapped to UI shape. */
function mapPeriod(p: string): "monthly" | "quarterly" | "yearly" {
  if (p === "quarterly" || p === "yearly") return p;
  return "monthly";
}

function deriveStatus(spent: number, allocated: number): "on_track" | "warning" | "over_budget" {
  if (spent > allocated) return "over_budget";
  if (allocated > 0 && spent / allocated >= 0.8) return "warning";
  return "on_track";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)));
    const q = (url.searchParams.get("q") || "").trim();

    const where: Record<string, unknown> = {};
    if (auth.scope.type === "hub") where.hubId = auth.scope.id;
    else if (auth.scope.type === "tenant") where.tenantId = auth.scope.id;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        { category: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: "desc" },
      }),
      prisma.budget.count({ where }),
    ]);

    const budgets = rows.map((row) => {
      const allocated = Number(row.allocatedUsd);
      const spent = Number(row.spentUsd);
      return {
        id: row.id,
        name: row.name,
        description: "",
        category: row.category ?? "",
        allocated,
        spent,
        currency: "USD",
        period: mapPeriod(row.period),
        startDate: row.startDate.toISOString(),
        endDate: row.endDate ? row.endDate.toISOString() : "",
        status: deriveStatus(spent, allocated),
      };
    });

    return NextResponse.json({ ok: true, budgets, total, page, pageSize });
  } catch (e) {
    console.error("[finance/budgets] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
