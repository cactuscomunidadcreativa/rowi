import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "lead",
      endpoints: [
        "/api/lead/new",
        "/api/lead/import",
        "/api/lead/status"
      ],
      note: "Endpoint base de gestión de leads, CRM o integraciones comerciales."
    },
    { headers: { "cache-control": "no-store" } }
  );
}