import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.i18n",
    endpoints: ["/api/hub/i18n/locales", "/api/hub/i18n/translations"],
    note: "Centro de gestión de traducciones del Hub.",
  });
}