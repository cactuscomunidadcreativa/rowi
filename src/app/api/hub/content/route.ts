import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.content",
    endpoints: ["/api/hub/content/pages", "/api/hub/content/posts"],
    note: "Punto de entrada para el contenido del hub (CMS / Sanity).",
  });
}