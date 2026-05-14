import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.transaction, {
    searchableFields: ["description", "reference"],
    orderBy: { date: "desc" },
    tenantField: "tenantId",
    include: {
      account: { select: { id: true, code: true, name: true } },
      tenant: { select: { id: true, name: true } },
      hub: { select: { id: true, name: true } },
    },
  });
}
