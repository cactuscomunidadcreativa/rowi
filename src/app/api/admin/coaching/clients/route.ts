import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.clientAccess, {
    searchableFields: ["clientEmail", "clientName"],
    orderBy: { createdAt: "desc" },
    relationTenantPath: "community.tenantId",
    include: {
      community: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}
