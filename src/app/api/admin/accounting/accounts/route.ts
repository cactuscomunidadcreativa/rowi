import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.accountCategory, {
    searchableFields: ["code", "name", "description"],
    orderBy: { code: "asc" },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      _count: { select: { transactions: true, children: true } },
    },
  });
}
