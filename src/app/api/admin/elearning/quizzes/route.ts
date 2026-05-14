import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { paginatedListHandler } from "@/core/admin/paginatedList";

export const preferredRegion = "iad1";

export async function GET(req: NextRequest) {
  return paginatedListHandler(req, prisma.quiz, {
    searchableFields: ["title"],
    orderBy: { id: "desc" },
    include: {
      lesson: { select: { id: true, title: true } },
      _count: { select: { attempts: true } },
    },
  });
}
