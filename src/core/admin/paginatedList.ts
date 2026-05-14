import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

type PrismaModel = {
  findMany: (args: object) => Promise<unknown[]>;
  count: (args?: object) => Promise<number>;
};

export interface PaginatedListOptions {
  searchableFields?: string[];
  orderBy?: object;
  include?: object;
  select?: object;
}

export async function paginatedListHandler(
  req: NextRequest,
  model: PrismaModel,
  opts: PaginatedListOptions = {},
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)),
    );
    const q = (url.searchParams.get("q") || "").trim();

    let where: object | undefined;
    if (q && opts.searchableFields?.length) {
      where = {
        OR: opts.searchableFields.map((field) => ({
          [field]: { contains: q, mode: "insensitive" as const },
        })),
      };
    }

    const findArgs: Record<string, unknown> = {
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: opts.orderBy ?? { id: "desc" },
    };
    if (where) findArgs.where = where;
    if (opts.include) findArgs.include = opts.include;
    if (opts.select) findArgs.select = opts.select;

    const [rows, total] = await Promise.all([
      model.findMany(findArgs),
      model.count(where ? { where } : undefined),
    ]);

    return NextResponse.json({ ok: true, rows, total, page, pageSize });
  } catch (e) {
    console.error("[paginatedListHandler] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
