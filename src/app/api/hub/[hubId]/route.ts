// apps/rowi/src/app/api/hub/[hubId]/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.[hubId]",
    note: "Información general del Hub específico.",
    endpoints: ["/api/hub/[hubId]/roles", "/api/hub/[hubId]/members"]
  });
}