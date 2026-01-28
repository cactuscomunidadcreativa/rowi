import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.builder",
    endpoints: ["/api/hub/builder/schema", "/api/hub/builder/components"],
    note: "Módulo de builder para estructuras o layouts del hub.",
  });
}