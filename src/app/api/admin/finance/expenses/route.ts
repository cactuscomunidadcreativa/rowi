import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/**
 * Finance expenses list — expenses are Transactions with type EXPENSE.
 * No separate Expense model; this is a filtered view over Transaction.
 * The EXPENSE filter must apply for every scope (including rowiverse), so we
 * build the query directly instead of using scopedPaginatedListHandler
 * (whose scopeWhere is skipped for the global rowiverse scope).
 */
function mapStatus(s: string): "pending" | "approved" | "rejected" | "reimbursed" {
  if (s === "pending") return "pending";
  if (s === "rejected") return "rejected";
  if (s === "reimbursed") return "reimbursed";
  return "approved"; // recorded / approved / anything else
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)));
    const q = (url.searchParams.get("q") || "").trim();

    const where: Record<string, unknown> = { type: "EXPENSE" };
    if (auth.scope.type === "hub") where.hubId = auth.scope.id;
    else if (auth.scope.type === "tenant") where.tenantId = auth.scope.id;

    if (q) {
      where.OR = [
        { description: { contains: q, mode: "insensitive" as const } },
        { reference: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: "desc" },
        include: {
          account: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const expenses = rows.map((row) => ({
      id: row.id,
      description: row.description ?? "",
      amount: Number(row.amountUsd),
      currency: row.currency,
      category: row.account?.name ?? "",
      submittedBy: "",
      submittedByEmail: "",
      status: mapStatus(row.status),
      date: row.date.toISOString(),
      receiptUrl: undefined,
      notes: undefined,
    }));

    return NextResponse.json({ ok: true, expenses, total, page, pageSize });
  } catch (e) {
    console.error("[finance/expenses] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
