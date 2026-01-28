import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "eq",
      endpoints: [
        "/api/eq/at",
        "/api/eq/me",
        "/api/eq/progress",
        "/api/eq/snapshots"
      ],
      note: "Índice general del módulo EQ: reportes, progreso y snapshots."
    },
    { headers: { "cache-control": "no-store" } }
  );
}