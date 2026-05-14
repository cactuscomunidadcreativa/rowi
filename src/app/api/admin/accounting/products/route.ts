import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.product, {
    searchableFields: ["sku", "name", "description", "category"],
    orderBy: { createdAt: "desc" },
    tenantField: "tenantId",
    include: {
      tenant: { select: { id: true, name: true } },
    },
  });
}
