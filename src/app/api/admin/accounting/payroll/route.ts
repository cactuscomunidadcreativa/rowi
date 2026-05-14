import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.payrollRun, {
    searchableFields: ["notes"],
    orderBy: { periodStart: "desc" },
    tenantField: "tenantId",
    include: {
      tenant: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });
}
