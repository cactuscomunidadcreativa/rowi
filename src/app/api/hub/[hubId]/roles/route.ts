// apps/rowi/src/app/api/hub/[hubId]/roles/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "hub.[hubId].roles",
    note: "Roles asignados dentro del Hub específico",
    endpoints: ["/api/hub/[hubId]/roles/[roleId]"]
  });
}