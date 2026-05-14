import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.product, {
    searchableFields: ["sku", "name", "description", "category"],
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { id: true, name: true } },
    },
  });
}
