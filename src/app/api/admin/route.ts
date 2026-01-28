import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "admin",
      endpoints: [
        "/api/admin/hubs",
        "/api/admin/users",
        "/api/admin/ui",
      ],
      note: "Este es un índice informativo. Los endpoints reales están en subrutas."
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}