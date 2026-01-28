import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.integrations",
    endpoints: ["/api/hub/integrations/slack", "/api/hub/integrations/make"],
    note: "Rutas para integraciones externas y automatizaciones.",
  });
}