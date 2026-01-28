import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.announcements",
    endpoints: ["/api/hub/announcements/list", "/api/hub/announcements/create"],
    note: "Índice de endpoints para el módulo de anuncios.",
  });
}