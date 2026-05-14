import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.emotionalEvent, {
    searchableFields: ["message", "type", "contextType"],
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      member: { select: { id: true, fullName: true } },
      rowiverseUser: { select: { id: true, name: true, email: true } },
    },
  });
}
