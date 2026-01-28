import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "hub",
      endpoints: [
        "/api/hub/ai",
        "/api/hub/announcements",
        "/api/hub/database",
        "/api/hub/domains",
        "/api/hub/logs",
        "/api/hub/modules",
        "/api/hub/pages",
        "/api/hub/tenants",
        "/api/hub/translations",
        "/api/hub/usage",
        "/api/hub/users"
      ]
    },
    { headers: { "cache-control": "no-store" } }
  );
}