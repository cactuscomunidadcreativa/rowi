import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.productivityLog, {
    searchableFields: ["taskName", "notes"],
    orderBy: { date: "desc" },
    include: {
      employee: {
        select: { id: true, position: true, user: { select: { name: true, email: true } } },
      },
    },
  });
}
