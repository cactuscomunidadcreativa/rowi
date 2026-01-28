// apps/rowi/src/app/api/insight/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "insight",
    note: "Endpoints relacionados con los insights de inteligencia emocional y de desempeño"
  });
}