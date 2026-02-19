import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Endpoint deshabilitado por seguridad" },
    { status: 403 }
  );
}
