import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

/** Finance invoices list — view over the real Invoice model, mapped to UI shape. */
function mapStatus(s: string): "draft" | "sent" | "paid" | "overdue" | "cancelled" {
  if (s === "sent" || s === "paid" || s === "overdue" || s === "cancelled") return s;
  return "draft";
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
        { number: { contains: q, mode: "insensitive" as const } },
        { clientName: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { issueDate: "desc" },
        include: {
          items: { select: { id: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const invoices = rows.map((row) => ({
      id: row.id,
      number: row.number ?? "",
      clientName: row.clientName,
      clientEmail: row.clientEmail ?? "",
      amount: Number(row.totalUsd),
      currency: "USD",
      status: mapStatus(row.status),
      dueDate: row.dueDate ? row.dueDate.toISOString() : "",
      issuedDate: row.issueDate.toISOString(),
      paidDate: undefined,
      items: row.items?.length ?? 0,
    }));

    return NextResponse.json({ ok: true, invoices, total, page, pageSize });
  } catch (e) {
    console.error("[finance/invoices] error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
