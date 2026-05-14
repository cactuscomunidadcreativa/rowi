import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.developmentPlan, {
    searchableFields: ["title", "description"],
    orderBy: { createdAt: "desc" },
    include: {
      community: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}
