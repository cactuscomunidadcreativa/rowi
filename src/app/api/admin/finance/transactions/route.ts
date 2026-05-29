import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/**
 * Finance transactions list — view over the real Transaction model (same data
 * accounting reads). Rows are mapped to the shape the UI page expects.
 */
function mapType(t: string): "income" | "expense" | "transfer" {
  if (t === "INCOME") return "income";
  if (t === "EXPENSE") return "expense";
  if (t === "TRANSFER") return "transfer";
  return "income";
}

function mapStatus(s: string): "completed" | "pending" | "failed" {
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  return "completed"; // recorded / completed / anything else
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

    const transactions = rows.map((row) => ({
      id: row.id,
      type: mapType(row.type),
      description: row.description ?? "",
      amount: Number(row.amountUsd),
      currency: row.currency,
      category: row.account?.name ?? "",
      account: row.account?.name ?? "",
      reference: row.reference ?? undefined,
      date: row.date.toISOString(),
      status: mapStatus(row.status),
    }));

    return NextResponse.json({ ok: true, transactions, total, page, pageSize });
  } catch (e) {
    console.error("[finance/transactions] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
