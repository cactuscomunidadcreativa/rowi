import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

export async function GET() {
  // Export CSV
  const rows = await prisma.usageDaily.findMany({
    orderBy: { day: "desc" },
    take: 500
  });
  const data = rows.map(r => ({
    tenantId: r.tenantId,
    agentId: r.agentId,
    day: r.day,
    tokensInput: r.tokensInput,
    tokensOutput: r.tokensOutput,
    costUsd: r.costUsd
  }));
  const csv = stringify(data, { header: true });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="usage.csv"'
    }
  });
}

export async function POST(req: Request) {
  // Import CSV
  const text = await req.text();
  try {
    const records = parse(text, { columns: true, skip_empty_lines: true });
    for (const rec of records) {
      await prisma.usageDaily.create({
        data: {
          tenantId: rec.tenantId,
          agentId: rec.agentId || null,
          day: new Date(rec.day),
          tokensInput: Number(rec.tokensInput) || 0,
          tokensOutput: Number(rec.tokensOutput) || 0,
          costUsd: parseFloat(rec.costUsd || "0")
        }
      });
    }
    return NextResponse.json({ ok: true, count: records.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
