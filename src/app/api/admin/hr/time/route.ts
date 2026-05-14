import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { tenantScopedPaginatedListHandler } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return tenantScopedPaginatedListHandler(req, prisma.timeEntry, {
    searchableFields: ["activity"],
    orderBy: { startedAt: "desc" },
    relationTenantPath: "employee.tenantId",
    include: {
      employee: {
        select: { id: true, position: true, user: { select: { name: true, email: true } } },
      },
    },
  });
}
