import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.payout, {
    searchableFields: ["description", "reference"],
    orderBy: { issuedAt: "desc" },
    tenantField: "tenantId",
    include: {
      user: { select: { id: true, name: true, email: true } },
      tenant: { select: { id: true, name: true } },
    },
  });
}
